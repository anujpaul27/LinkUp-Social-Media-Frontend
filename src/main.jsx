import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router'
import Main from './Components/Main'
import Feed_RightBar from './Components/Feed_RightBar'
import Login from './Authentication/Login'
import Registration from './Authentication/Registration'
import ContextProvider from './Context/ContextProvider'
import PrivateRoute from './Authentication/PrivateRoute'
import Profile from './LayOut/Profile'
import Friends from './LayOut/Friends'
import EditProfile from './User/EditProfile'
import OtherProfile from './LayOut/OtherProfile'
import Message from './LayOut/Message'
import Saved from './LayOut/Saved'
import Setting from './LayOut/Setting'
import CreatePost from './LayOut/CreatePostPage'


const router = createBrowserRouter([
  {
    path: '/',
    element: <PrivateRoute><Main></Main></PrivateRoute>,
    children: [
      {
        path: '/',
        element: <Feed_RightBar></Feed_RightBar>
      },
      {
        path: '/profile',
        element: <Profile></Profile>
      },
      {
        path: 'editprofile',
        element: <EditProfile></EditProfile>
      },
      {
        path: '/friend',
        element: <Friends></Friends>
      },
      {
        path: '/otherprofile/:uid',
        element: <OtherProfile></OtherProfile>,
        loader: ({ params }) => { return params.uid }
      },
      
      {
        path: '/saved',
        element: <Saved></Saved>
      },
      {
        path: '/setting',
        element: <Setting></Setting>
      },
      {
        path: 'CreatePost',
        element: <CreatePost> </CreatePost>
      }
    ]
  },
  {
    path: '/login',
    element: <Login></Login>
  },
  {
    path: '/registration',
    element: <Registration></Registration>
  },
  {
        path: '/message',
        element:  <PrivateRoute><Message></Message></PrivateRoute>
      },

])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ContextProvider>
      <RouterProvider router={router}></RouterProvider>
    </ContextProvider>
  </StrictMode>,
)
