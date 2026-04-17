import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useHospitalAuth, UserRole } from "@/contexts/HospitalAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Eye, EyeOff, Stethoscope, Users, UserCheck } from "lucide-react";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("patient");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { login } = useHospitalAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    const ok = await login(email, password, role);
    if (ok) {
      navigate(role === "admin" ? "/admin/dashboard" : role === "doctor" ? "/doctor/dashboard" : "/patient/dashboard");
    } else {
      setError("Invalid credentials");
    }
  };

  const roleOptions: { value: UserRole; label: string; icon: React.ReactNode }[] = [
    { value: "patient", label: "Patient", icon: <UserCheck className="h-4 w-4" /> },
    { value: "doctor", label: "Doctor", icon: <Stethoscope className="h-4 w-4" /> },
    { value: "admin", label: "Admin", icon: <Users className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-blue-600 to-emerald-500 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-400/20 rounded-full blur-3xl translate-x-1/4 translate-y-1/4" />
        <div className="relative text-center z-10">
          <div className="w-32 h-32 mx-auto rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-8">
            <Heart className="h-16 w-16 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">Welcome Back!</h2>
          <p className="text-white/80 text-lg max-w-md">
            Access your healthcare dashboard and manage appointments with ease.
          </p>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center">
              <Heart className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">SSN Hospital</span>
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">Sign In</h1>
          <p className="text-muted-foreground mb-8">Enter your credentials to access your account</p>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mb-6">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label className="text-foreground">Role</Label>
              <div className="grid grid-cols-3 gap-2 mt-1.5">
                {roleOptions.map((r) => (
                  <button
                    type="button"
                    key={r.value}
                    onClick={() => setRole(r.value)}
                    className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                      role === r.value
                        ? "bg-primary text-primary-foreground border-primary shadow-md"
                        : "bg-card text-muted-foreground border-border hover:border-primary/50"
                    }`}
                  >
                    {r.icon}
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-foreground">Password</Label>
              <div className="relative mt-1.5">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full bg-gradient-to-r from-primary to-emerald-500 hover:opacity-90 text-primary-foreground font-semibold h-11">
              Login
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{" "}
            <button onClick={() => navigate("/signup")} className="text-primary hover:underline font-medium">
              Register
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
