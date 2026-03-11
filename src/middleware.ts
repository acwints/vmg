import { withAuth } from "next-auth/middleware";
import { nextAuthSecret } from "@/lib/auth-env";

export default withAuth({
  pages: {
    signIn: "/login",
  },
  secret: nextAuthSecret,
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
