import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { User, MapPin, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/edit2.png";

interface NavigationProps {
  // Remove props as we'll use auth context
}

const Navigation = (props: NavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!user) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img
              src={logo}
              alt="OnTwoWheelz Logo"
              className="h-10 w-10"
            />
            <div
              className="text-xl font-bold cursor-pointer hover:text-primary transition-colors"
              onClick={() => navigate("/")}
            >
              <span className="text-red-600">On</span>
              <span>TwoWheelz</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate("/")}>
              Home
            </Button>
            <Button variant="outline" onClick={() => navigate("/login")}>
              Login
            </Button>
            <Button variant="hero" onClick={() => navigate("/register")}>
              Get Started
            </Button>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <img
            src={logo}
            alt="OnTwoWheelz Logo"
            className="h-10 w-10"
          />
          <div
            className="text-xl font-bold cursor-pointer hover:text-primary transition-colors"
            onClick={() => navigate("/")}
          >
            <span className="text-red-600">On</span>
            <span>TwoWheelz</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant={location.pathname === "/dashboard" ? "adventure" : "ghost"}
            onClick={() => navigate("/dashboard")}
          >
            Dashboard
          </Button>
          <Button
            variant={location.pathname === "/alltrips" ? "adventure" : "ghost"}
            onClick={() => navigate("/alltrips")}
          >
            <MapPin className="h-4 w-4" />
            Trips
          </Button>
          <Button
            variant={location.pathname === "/profile" ? "adventure" : "ghost"}
            onClick={() => navigate("/profile")}
          >
            <User className="h-4 w-4" />
            Profile
          </Button>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;