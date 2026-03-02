import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { AdminPage } from "./pages/AdminPage";
import { UserSchedulePage } from "./pages/UserSchedulePage";
import { EventListPage } from "./pages/EventListPage";
import { EventWrapper } from "./components/EventWrapper";
import { PaymentListPage } from "./pages/PaymentListPage";
import { PaymentDetailPage } from "./pages/PaymentDetailPage";
import { TimelinePage } from "./pages/TimelinePage";

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
          { path: "timeline", Component: TimelinePage },
        ],
      },
      { path: "payments", Component: PaymentListPage },
      { path: "payments/:paymentId", Component: PaymentDetailPage },
    ],
  },
]);
