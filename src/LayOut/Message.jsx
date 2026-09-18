import React, { useEffect, useState, useRef, useContext } from "react";
import { motion } from "framer-motion";
import { Send, ArrowLeft, Users, Search } from "lucide-react";
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

  // (AI Message Suggestion 1): create state for store suggestion message from the AI response
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);

  // (AI Message Suggestion 2): Create ai suggestion message with current and target user id
  const CreateAiSuggestionMessage = async () => {
    if (!activeReceiver?._id || !CURRENT_USER_ID) return;
    try {
      setAiLoading(true);
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/messages/generate-message-suggestion`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // for cookies and token after implement
          body: JSON.stringify({
            currentUserId: CURRENT_USER_ID,
            targetUserId: activeReceiver._id,
          }),
        },
      );

      const data = await res.json(); // get the data from the response

      if (data?.success) {
        setAiSuggestions(data.suggestions); // store the message array into the state
      }
    } catch (err) {
      console.error("AI Suggestions error:", err);
    } finally {
      setAiLoading(false);
    }
  };

  // (AI Message Suggestion 3): When change the chat place before suggestion will be clear
  useEffect(() => {
    setAiSuggestions([]);
  }, [activeReceiver]);

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

  // Dynamic background color
  const [bgColor, setBgColor] = useState("#25D366");

  useEffect(() => {
    const colors = ["#25D366", "#128C7E", "#075E54", "#1F2A33"];
    const interval = setInterval(() => {
      setBgColor(colors[Math.floor(Math.random() * colors.length)]);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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
        <div className="flex h-screen overflow-hidden bg-[#0A0F14] text-white font-sans">
          {/* Dynamic Background Overlay */}
          <motion.div
            className="absolute inset-0 opacity-10 pointer-events-none"
            animate={{
              background: `linear-gradient(135deg, ${bgColor} 0%, #111B21 100%)`,
            }}
            transition={{ duration: 5, ease: "easeInOut" }}
          />

          {/* ====================== SIDEBAR (Users List) ====================== */}
          <div
            className={`w-full lg:w-96 border-r border-[#2A3A47] flex flex-col bg-[#1F2A33] absolute lg:relative h-full z-20 transition-transform duration-300 ${
              activeReceiver
                ? "-translate-x-full lg:translate-x-0"
                : "translate-x-0"
            }`}
          >
            {/* Search */}
            <div className="p-4">
              <div className="relative">
                <Search
                  className="absolute left-4 top-3 text-[#8696A0]"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#2A3A47] border border-[#3A4A57] focus:border-[#25D366] pl-11 py-3 rounded-2xl text-sm outline-none"
                />
              </div>
            </div>

            {/* Users List */}
            <div className="flex-1 overflow-y-auto px-2 space-y-1">
              {filteredUsers?.map((user) => {
                const isOnline = onlineUsersList.includes(user._id);
                return (
                  <button
                    key={user?._id}
                    onClick={() => setActiveReceiver(user)}
                    className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all hover:bg-[#2A3A47] ${
                      activeReceiver?._id === user?._id ? "bg-[#2A3A47]" : ""
                    }`}
                  >
                    <div className="relative">
                      <img
                        src={user?.photoURL || "/default-avatar.png"}
                        alt={user?.name}
                        className={`w-14 h-14 rounded-full object-cover ${isOnline && "border-2 border-[#25D366]/30"}`}
                      />
                      {isOnline && (
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-[#1F2A33]"></div>
                      )}
                    </div>

                    <div className="flex-1 text-left">
                      <p className="font-medium text-lg">{user?.name}</p>
                      <div className="text-sm text-[#8696A0] truncate">
                        {user?.unseenCount > 0 ? (
                          <p className="text-white font-bold">
                            {user?.unseenCount} unseen
                          </p>
                        ) : (
                          <p className="text-sm mt-1 text-[#8696A0] truncate">
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
                <div className="h-16 bg-[#1F2A33] border-b border-[#2A3A47] flex items-center px-4 lg:px-6 z-10">
                  <button
                    onClick={() => setActiveReceiver(null)}
                    className="mr-3 lg:hidden text-[#8696A0] p-2 -ml-2"
                  >
                    <ArrowLeft size={28} />
                  </button>

                  <div className="flex items-center gap-4">
                    <img
                      src={activeReceiver.photoURL || "/default-avatar.png"}
                      alt={activeReceiver.name}
                      className="w-10 h-10 lg:w-11 lg:h-11 rounded-full object-cover"
                    />
                    <div>
                      <h2 className="font-semibold text-xl">
                        {activeReceiver.name}
                      </h2>
                      {isPartnerTyping ? (
                        <p className="text-sm text-[#25D366]">Typing...</p>
                      ) : onlineUsersList.includes(activeReceiver._id) ? (
                        <p className="text-sm font-bold text-[#25D366]">
                          online
                        </p>
                      ) : (
                        <p className="text-sm font-bold text-[#d32525]">
                          offline
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 bg-[#0F1A21]">
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
                              ? "bg-[#25D366] text-black rounded-br-none"
                              : "bg-[#2A3A47] text-white rounded-bl-none"
                          }`}
                        >
                          <p className="text-[17px] leading-relaxed">
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
                      <div className="chat-bubble flex items-center space-x-1 py-4 px-3">
                        {[0, 1, 2].map((index) => (
                          <motion.span
                            key={index}
                            className="w-2 h-2 bg-current  rounded-full"
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
                  className="p-4 lg:p-5 bg-[#1F2A33] border-t border-[#2A3A47]"
                >
                  {/* ================= AI MESSAGE SUGGESTIONS SECTION  ================= */}
                  {/* (AI Message Suggestion 4): AI Click Button  */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <button
                        type="button"
                        onClick={CreateAiSuggestionMessage}
                        disabled={aiLoading}
                        className="flex items-center gap-1.5 text-xs bg-[#2A3A47] hover:bg-[#3A4A57] text-[#25D366] border border-[#25D366]/30 px-3 py-1.5 rounded-full transition-all disabled:opacity-50"
                      >
                        <span>✨</span>
                        <span>
                          {aiLoading ? "Generating..." : "Get AI Suggestions"}
                        </span>
                      </button>
                    </div>

                    {/* AI Suggestions Chips */}
                    {aiSuggestions.length > 0 && (
                      <div className="flex flex-wrap gap-2 animate-fadeIn">
                        {aiSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setMessageText(suggestion)}
                            className="text-xs bg-[#2A3A47] hover:bg-[#25D366] hover:text-black text-white px-3 py-1.5 rounded-xl border border-[#3A4A57] transition-all text-left"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* ========================================================================= */}
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => {
                        setMessageText(e.target.value);
                        handleInputChange(e);
                      }}
                      placeholder={`Message ${activeReceiver.name}...`}
                      className="flex-1 bg-[#2A3A47] border border-[#3A4A57] focus:border-[#25D366] rounded-3xl px-6 py-4 outline-none text-lg"
                    />
                    <button
                      type="submit"
                      disabled={!messageText.trim()}
                      className="bg-[#25D366] hover:bg-[#20C258] disabled:bg-[#3A4A57] w-14 h-14 rounded-3xl flex items-center justify-center transition-all active:scale-95"
                    >
                      <Send size={24} className="text-black" />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                <div className="text-8xl mb-8 opacity-40">💬</div>
                <h2 className="text-4xl font-light text-white mb-4">
                  Welcome to WhatsApp
                </h2>
                <p className="text-[#8696A0] text-xl max-w-md">
                  Select a user from the sidebar to start a secure conversation
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
