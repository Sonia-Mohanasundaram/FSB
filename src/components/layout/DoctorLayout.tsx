import React from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useHospitalAuth } from "@/contexts/HospitalAuthContext";
import { Heart, LayoutDashboard, Clock, CalendarCheck, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const links = [
  { label: "Dashboard", path: "/doctor/dashboard", icon: LayoutDashboard },
  { label: "Set Availability", path: "/doctor/availability", icon: Clock },
  { label: "My Schedule", path: "/doctor/schedule", icon: CalendarCheck },
];

const DoctorLayout: React.FC = () => {
  const { logout, user } = useHospitalAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row">
      <header className="md:hidden sticky top-0 z-40 bg-background border-b border-border">
        <div className="h-14 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center shrink-0">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold text-foreground truncate">MediCare</span>
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <div className="h-full flex flex-col">
                <SheetHeader className="p-6 border-b border-border">
                  <SheetTitle>Menu</SheetTitle>
                  <div className="mt-3 bg-muted/40 rounded-xl p-3">
                    <p className="text-sm font-medium truncate">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">Doctor</p>
                  </div>
                </SheetHeader>
                <nav className="flex-1 p-3 space-y-1">
                  {links.map((l) => (
                    <button
                      key={l.path}
                      onClick={() => navigate(l.path)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${
                        location.pathname === l.path ? "bg-muted" : "hover:bg-muted/60"
                      }`}
                    >
                      <l.icon className="h-5 w-5" />
                      {l.label}
                    </button>
                  ))}
                </nav>
                <div className="p-3 border-t border-border">
                  <button
                    onClick={() => {
                      logout();
                      navigate("/");
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-muted/60 transition-all"
                  >
                    <LogOut className="h-5 w-5" />
                    Logout
                  </button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <aside className="hidden md:flex w-64 flex-col bg-gradient-to-b from-emerald-600 to-teal-700 text-white">
        <div className="p-6 flex items-center gap-2">
          <Heart className="h-6 w-6" />
          <span className="font-bold text-lg">MediCare</span>
        </div>
        <div className="px-4 py-2 mb-4">
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs opacity-70">Doctor</p>
          </div>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {links.map((l) => (
            <button
              key={l.path}
              onClick={() => navigate(l.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                location.pathname === l.path ? "bg-white/20 shadow-lg" : "hover:bg-white/10"
              }`}
            >
              <l.icon className="h-5 w-5" />
              {l.label}
            </button>
          ))}
        </nav>
        <div className="p-3 mt-auto">
          <button
            onClick={() => { logout(); navigate("/"); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-white/10 transition-all"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-auto bg-background">
        <Outlet />
      </main>
    </div>
  );
};

export default DoctorLayout;
