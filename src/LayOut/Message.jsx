import React, { useEffect, useState, useRef, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ArrowLeft, Search, MessageCircle, Sparkles, AlertTriangle } from "lucide-react";
import { io } from "socket.io-client";
import { UserContext } from "../Context/ContextProvider";
import axios from "axios";

export default function Message() {
  const [socket, setSocket] = useState(null);
  const [users, setUsers] = useState([]);
  const [activeReceiver, setActiveReceiver] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const chatEndRef = useRef(null);
  const [onlineUsersList, setOnlineUsersList] = useState([]);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const { DBUser } = useContext(UserContext);
  const CURRENT_USER_ID = DBUser?._id;

  // (AI Sms Loading 1): Add animated loading states
  const [loadingIndex, setLoadingIndex] = useState(0);

  //
  const [aiCount, setAiCount] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  // (AI Message Suggestion 1): create state for store suggestion message from the AI response
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);

  // (AI Message Suggestion 2): When change the chat place before suggestion will be clear
  useEffect(() => {
    setAiSuggestions([]);
  }, [activeReceiver]);

  // (AI Sms Loading 2): Create loading topic
  const LOADING_TEXTS = [
    "Generating...",
    "Thinking...",
    "Analyzing chat...",
    "Crafting replies...",
    "Almost ready...",
  ];

  // (AI Sms Loading 3): use setInterval for after 2 second change your loading message subject
  useEffect(() => {
    let interval;
    if (aiLoading) {
      setLoadingIndex(0);
      interval = setInterval(() => {
        setLoadingIndex((prevIndex) => (prevIndex + 1) % LOADING_TEXTS.length);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [aiLoading]);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    } else if (cooldown === 0) {
      setAiCount(0); // টাইমার শেষ হলে কাউন্ট রিকভার হবে
      setErrorMessage("");
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // (AI Message Suggestion 3): Create ai suggestion message with current and target user id
  const CreateAiSuggestionMessage = async () => {
    if (!activeReceiver?._id || !CURRENT_USER_ID) return;

    // ফ্রন্টএন্ড চেক: ১ মিনিটে ২ বারের বেশি হলে ব্লক করবে
    if (aiCount >= 2 && cooldown > 0) {
      setErrorMessage(`Please wait ${cooldown}s before asking again.`);
      return;
    }

    try {
      setAiLoading(true);
      setErrorMessage("");

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/messages/generate-message-suggestion`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            currentUserId: CURRENT_USER_ID,
            targetUserId: activeReceiver._id,
          }),
        },
      );

      const data = await res.json();

      // যদি ব্যাকএন্ড থেকে ৪২৯ (Too Many Requests) আসে
      if (res.status === 429) {
        setErrorMessage(data.message || "Limit reached. Try again in 1 min.");
        setCooldown(60);
        return;
      }

      if (data?.success) {
        setAiSuggestions(data.suggestions);

        // কাউন্ট ১ বাড়ানো এবং ২ বার হয়ে গেলে ৬০ সেকেন্ড কুলডাউন স্টার্ট করা
        const newCount = aiCount + 1;
        setAiCount(newCount);
        if (newCount >= 2) {
          setCooldown(60);
        }
      }
    } catch (err) {
      console.error("AI Suggestions error:", err);
    } finally {
      setAiLoading(false);
    }
  };

  // Fetch all users/friends
  useEffect(() => {
    if (!CURRENT_USER_ID) return;
    const fetchFriends = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/user/${CURRENT_USER_ID}`,
          {
            withCredentials: true,
          },
        );
        setUsers(res.data);
      } catch (err) {
        console.error("Error fetching friends:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, [CURRENT_USER_ID]);

  const moveUserToTop = (partnerId) => {
    setUsers((prevUsers) => {
      const targetUser = prevUsers.find((u) => u._id === partnerId);
      if (!targetUser) return prevUsers;
      const remainingUsers = prevUsers.filter((u) => u._id !== partnerId);
      return [targetUser, ...remainingUsers];
    });
  };

  // Initialize Socket
  useEffect(() => {
    if (!CURRENT_USER_ID) return;
    const newSocket = io(`${import.meta.env.VITE_API_URL}`);
    setSocket(newSocket);

    newSocket.emit("addUserOnline", CURRENT_USER_ID);

    newSocket.on("getOnlineUsers", (users) => {
      setOnlineUsersList(users);
    });

    return () => newSocket.disconnect();
  }, [CURRENT_USER_ID]);

  // Chat History + Socket Listeners
  useEffect(() => {
    if (!socket || !activeReceiver) return;

    const markMessagesAsSeen = async () => {
      try {
        await fetch(
          `${import.meta.env.VITE_API_URL}/api/messages/mark-as-seen`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              senderId: activeReceiver._id,
              receiverId: CURRENT_USER_ID,
            }),
          },
        );

        setUsers((prevUsers) =>
          prevUsers.map((u) =>
            u._id === activeReceiver._id ? { ...u, unseenCount: 0 } : u,
          ),
        );
      } catch (err) {
        console.error(err);
      }
    };

    markMessagesAsSeen();

    const fetchChatHistory = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/messages/${CURRENT_USER_ID}/${activeReceiver._id}`,
        );
        const data = await res.json();
        setMessages(data || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchChatHistory();

    socket.emit("joinRoom", {
      senderId: CURRENT_USER_ID,
      receiverId: activeReceiver._id,
    });

    socket.on("receiveMessage", (newMessage) => {
      if (newMessage) {
        if (
          activeReceiver?._id === newMessage.sender ||
          activeReceiver?._id === newMessage.receiver
        ) {
          setMessages((prev) => [...prev, newMessage]);
        }

        const partnerId =
          newMessage.sender === CURRENT_USER_ID
            ? newMessage.receiver
            : newMessage.sender;

        setUsers((prevUsers) =>
          prevUsers.map((u) => {
            if (u._id === partnerId) {
              const shouldIncrement =
                newMessage.sender !== CURRENT_USER_ID &&
                activeReceiver?._id !== partnerId;
              return {
                ...u,
                unseenCount: shouldIncrement ? (u.unseenCount || 0) + 1 : 0,
              };
            }
            return u;
          }),
        );

        moveUserToTop(partnerId);
      }
    });

    socket.on("partnerTyping", (data) => {
      if (data.senderId === activeReceiver?._id) {
        setIsPartnerTyping(data.isTyping);
      }
    });

    return () => {
      socket.off("receiveMessage");
      socket.off("partnerTyping");
    };
  }, [activeReceiver, socket, CURRENT_USER_ID]);

  const handleInputChange = (e) => {
    setMessageText(e.target.value);

    if (!socket || !activeReceiver) return;

    const roomId = [CURRENT_USER_ID, activeReceiver._id].sort().join("-");
    socket.emit("typing", { roomId, senderId: CURRENT_USER_ID });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", { roomId, senderId: CURRENT_USER_ID });
    }, 3000);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPartnerTyping]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageText.trim() || !socket || !activeReceiver) return;

    const messageData = {
      sender: CURRENT_USER_ID,
      receiver: activeReceiver._id,
      text: messageText,
      messageType: "text",
    };

    socket.emit("sendMessage", messageData);
    moveUserToTop(activeReceiver._id);
    setMessageText("");

    const roomId = [CURRENT_USER_ID, activeReceiver._id].sort().join("-");
    socket.emit("stopTyping", { roomId, senderId: CURRENT_USER_ID });
  };

  const filteredUsers = users.filter((user) =>
    user?.name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <>
      {loading ? (
        <div className="flex min-h-screen w-full items-center justify-center">
          <span className="loading loading-spinner text-primary loading-lg"></span>
        </div>
      ) : (
        <div className="flex h-[calc(100dvh-4rem)] lg:h-dvh -mb-16 lg:mb-0 overflow-hidden bg-base-100 text-base-content">
          {/* ====================== SIDEBAR (Users List) ====================== */}
          <div
            className={`w-full lg:w-96 border-r border-base-300 flex flex-col bg-base-200 absolute lg:relative h-full z-20 transition-transform duration-300 ${
              activeReceiver
                ? "-translate-x-full lg:translate-x-0"
                : "translate-x-0"
            }`}
          >
            {/* Header */}
            <div className="px-4 pt-4 pb-1 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Direct</h2>
            </div>

            {/* Search */}
            <div className="p-4">
              <div className="relative">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/40"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-base-300/60 border border-base-300 focus:border-primary pl-11 py-3 rounded-2xl text-sm outline-none transition-colors"
                />
              </div>
            </div>

            {/* Users List */}
            <div className="flex-1 overflow-y-auto px-2 space-y-1 scrollbar-thin">
              {filteredUsers?.map((user) => {
                const isOnline = onlineUsersList.includes(user._id);
                return (
                  <button
                    key={user?._id}
                    onClick={() => setActiveReceiver(user)}
                    className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-colors hover:bg-base-300/70 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${
                      activeReceiver?._id === user?._id ? "bg-base-300/70" : ""
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={user?.photoURL || "/default-avatar.png"}
                        alt={user?.name}
                        className={`w-14 h-14 rounded-full object-cover ${isOnline && "ring-2 ring-primary/40"}`}
                      />
                      {isOnline && (
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-success rounded-full border-2 border-base-200"></div>
                      )}
                    </div>

                    <div className="flex-1 text-left min-w-0">
                      <p className="font-medium text-base truncate">{user?.name}</p>
                      <div className="text-sm text-base-content/50 truncate">
                        {user?.unseenCount > 0 ? (
                          <p className="text-primary font-semibold">
                            {user?.unseenCount} unseen
                          </p>
                        ) : (
                          <p className="text-sm mt-0.5 text-base-content/50 truncate">
                            Tap to start chatting
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ====================== MAIN CHAT AREA ====================== */}
          <div className="flex-1 flex flex-col h-full relative">
            {activeReceiver ? (
              <>
                {/* Chat Header */}
                <div className="h-16 bg-base-200 border-b border-base-300 flex items-center px-4 lg:px-6 z-10 shrink-0">
                  <button
                    onClick={() => setActiveReceiver(null)}
                    aria-label="Back to conversations"
                    className="mr-3 lg:hidden text-base-content/60 p-2 -ml-2 rounded-full hover:bg-base-300/60 focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    <ArrowLeft size={24} />
                  </button>

                  <div className="flex items-center gap-3">
                    <img
                      src={activeReceiver.photoURL || "/default-avatar.png"}
                      alt={activeReceiver.name}
                      className="w-10 h-10 lg:w-11 lg:h-11 rounded-full object-cover"
                    />
                    <div>
                      <h2 className="font-semibold text-base lg:text-lg">
                        {activeReceiver.name}
                      </h2>
                      {isPartnerTyping ? (
                        <p className="text-xs text-primary">Typing...</p>
                      ) : onlineUsersList.includes(activeReceiver._id) ? (
                        <p className="text-xs font-medium text-success">
                          online
                        </p>
                      ) : (
                        <p className="text-xs font-medium text-base-content/40">
                          offline
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 bg-base-100 scrollbar-thin">
                  {messages?.map((msg, index) => {
                    const isMe = msg.sender === CURRENT_USER_ID;
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] lg:max-w-[70%] px-5 py-3 rounded-3xl ${
                            isMe
                              ? "bg-primary text-primary-content rounded-br-md"
                              : "bg-base-200 text-base-content rounded-bl-md"
                          }`}
                        >
                          <p className="text-[15px] lg:text-[17px] leading-relaxed break-words">
                            {msg.text}
                          </p>
                          <p className="text-xs mt-1 opacity-70 text-right">
                            {new Date(
                              msg.createdAt || Date.now(),
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                  {isPartnerTyping && (
                    <div className="chat chat-start my-1">
                      <div className="chat-bubble bg-base-200 flex items-center space-x-1 py-4 px-3">
                        {[0, 1, 2].map((index) => (
                          <motion.span
                            key={index}
                            className="w-2 h-2 bg-current rounded-full"
                            initial={{ y: 0 }}
                            animate={{ y: [0, -6, 0] }}
                            transition={{
                              duration: 0.6,
                              repeat: Infinity,
                              repeatType: "loop",
                              delay: index * 0.15,
                              ease: "easeInOut",
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Message Input */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 sm:p-4 lg:p-5 bg-base-200 border-t border-base-300 shrink-0"
                >
                  {/* ================= AI MESSAGE SUGGESTIONS SECTION  ================= */}
                  {/* (AI Message Suggestion 4): AI Click Button  */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <button
                        type="button"
                        onClick={CreateAiSuggestionMessage}
                        disabled={aiLoading || cooldown > 0}
                        className="flex items-center gap-1.5 text-xs bg-base-300/70 hover:bg-base-300 text-primary border border-primary/30 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                      >
                        <motion.span
                          animate={aiLoading ? { rotate: 360 } : { rotate: 0 }}
                          transition={{
                            repeat: Infinity,
                            duration: 2,
                            ease: "linear",
                          }}
                          className="inline-flex"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </motion.span>

                        <span className="inline-flex min-w-[110px] text-left">
                          <AnimatePresence mode="wait">
                            {aiLoading ? (
                              <motion.span
                                key={loadingIndex}
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -10, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="inline-block"
                              >
                                {LOADING_TEXTS[loadingIndex]}
                              </motion.span>
                            ) : cooldown > 0 ? (
                              <motion.span
                                key="cooldown"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-warning font-medium"
                              >
                                Wait {cooldown}s
                              </motion.span>
                            ) : (
                              <motion.span
                                key="static"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                              >
                                Get AI Suggestions
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </span>
                      </button>
                    </div>

                    {/* Error or Limit Warning Message */}
                    {errorMessage && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-[11px] text-warning mt-1 mb-2 font-medium flex items-center gap-1"
                      >
                        <AlertTriangle className="w-3 h-3" /> {errorMessage}
                      </motion.p>
                    )}

                    {/* AI Suggestions Chips */}
                    {aiSuggestions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {aiSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setMessageText(suggestion)}
                            className="text-xs bg-base-300/70 hover:bg-primary hover:text-primary-content text-base-content px-3 py-1.5 rounded-xl border border-base-300 transition-colors text-left focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* ========================================================================= */}
                  <div className="flex gap-2 sm:gap-3">
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => {
                        setMessageText(e.target.value);
                        handleInputChange(e);
                      }}
                      placeholder={`Message ${activeReceiver.name}...`}
                      className="flex-1 min-w-0 bg-base-300/60 border border-base-300 focus:border-primary rounded-3xl px-5 sm:px-6 py-3.5 sm:py-4 outline-none text-base sm:text-lg transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={!messageText.trim()}
                      aria-label="Send message"
                      className="bg-primary hover:bg-primary/90 disabled:bg-base-300 disabled:text-base-content/30 text-primary-content w-12 h-12 sm:w-14 sm:h-14 rounded-3xl flex items-center justify-center transition-all active:scale-95 shrink-0 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                    >
                      <Send size={22} />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                <div className="w-20 h-20 rounded-full bg-base-200 flex items-center justify-center mb-6">
                  <MessageCircle className="w-9 h-9 text-primary" />
                </div>
                <h2 className="text-2xl lg:text-4xl font-light mb-3">
                  Welcome to LinkUp Direct
                </h2>
                <p className="text-base-content/50 text-base lg:text-xl max-w-md">
                  Select a user from the sidebar to start a conversation
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}