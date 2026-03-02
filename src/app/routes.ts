import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { AdminPage } from "./pages/AdminPage";
import { UserSchedulePage } from "./pages/UserSchedulePage";
import { EventListPage } from "./pages/EventListPage";
import { EventWrapper } from "./components/EventWrapper";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "events", Component: EventListPage },
      {
        path: "events/:eventId",
        Component: EventWrapper,
        children: [
          { path: "admin", Component: AdminPage },
          { path: "schedule", Component: UserSchedulePage },
        ],
      },
    ],
  },
]);
