import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  Calendar,
  Users,
  Stethoscope,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  Star,
  Clock,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const doctors = [
  { name: "Dr. Mohan", specialization: "General Doctor", rating: 4.9 },
  { name: "Dr. Pubesh", specialization: "Neurology", rating: 4.8 },
  { name: "Dr. Krishnaveni", specialization: "Gynecolgist", rating: 4.9 },
  { name: "Dr. Pooja", specialization: "Orthopedics", rating: 4.7 },
];

const services = [
  { title: "Appointment Booking", description: "Book appointments with top doctors in just a few clicks", icon: Calendar, gradient: "from-blue-500 to-cyan-500" },
  { title: "Expert Doctors", description: "Access a network of highly qualified medical professionals", icon: Stethoscope, gradient: "from-emerald-500 to-teal-500" },
  { title: "Easy Scheduling", description: "Flexible scheduling that fits your busy lifestyle", icon: Clock, gradient: "from-purple-500 to-indigo-500" },
];

const HospitalLanding: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center">
              <Heart className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">SSN Hospital</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#home" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Home</a>
            <a href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</a>
            <a href="#doctors" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Doctors</a>
            <a href="#contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</a>
          </div>
          <Button onClick={() => navigate("/login")} className="bg-gradient-to-r from-primary to-emerald-500 hover:opacity-90 text-primary-foreground">
            Login
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-emerald-500/5" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Shield className="h-4 w-4" /> Trusted by 10,000+ patients
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Book Your Doctor<br />
            <span className="bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">
              Appointment Easily
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            Fast, Simple & Reliable Hospital Management. Access top doctors, manage appointments, and take control of your healthcare journey.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button onClick={() => navigate("/login")} size="lg" className="bg-gradient-to-r from-primary to-emerald-500 hover:opacity-90 text-primary-foreground px-8 text-base">
              Book Appointment <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button onClick={() => { document.getElementById("doctors")?.scrollIntoView({ behavior: "smooth" }); }} variant="outline" size="lg" className="px-8 text-base">
              View Doctors
            </Button>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-foreground mb-3">Our Services</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Everything you need for a seamless healthcare experience</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((s) => (
              <div key={s.title} className="group bg-card border border-border rounded-2xl p-8 card-shadow hover:card-shadow-lg transition-all hover:-translate-y-1">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.gradient} flex items-center justify-center mb-6 shadow-lg`}>
                  <s.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-card-foreground mb-2">{s.title}</h3>
                <p className="text-muted-foreground">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Doctors Section */}
      <section id="doctors" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-foreground mb-3">Our Doctors</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Meet our team of experienced medical professionals</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {doctors.map((doc) => (
              <div key={doc.name} className="group bg-card border border-border rounded-2xl overflow-hidden card-shadow hover:card-shadow-lg transition-all hover:-translate-y-1">
                <div className="h-48 bg-gradient-to-br from-primary/20 to-emerald-500/20 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center">
                    <Stethoscope className="h-10 w-10 text-white" />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-semibold text-card-foreground text-lg">{doc.name}</h3>
                  <p className="text-primary text-sm font-medium mt-1">{doc.specialization}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Star className="h-4 w-4 text-warning fill-warning" />
                    <span className="text-sm text-muted-foreground">{doc.rating}</span>
                  </div>
                  <Button onClick={() => navigate("/login")} variant="outline" className="w-full mt-4 border-primary/30 text-primary hover:bg-primary/5">
                    View Availability
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-4">About MediCare Hospital</h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                SSN Hospital Management System is designed to provide a seamless healthcare experience.
                We connect patients with top medical professionals, making appointment booking effortless.
                Our platform ensures that every patient receives quality care with minimal wait times.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center p-4 bg-card rounded-xl border border-border">
                  <p className="text-3xl font-bold text-primary">3+</p>
                  <p className="text-sm text-muted-foreground">Expert Doctors</p>
                </div>
                <div className="text-center p-4 bg-card rounded-xl border border-border">
                  <p className="text-3xl font-bold text-emerald-500">10K+</p>
                  <p className="text-sm text-muted-foreground">Happy Patients</p>
                </div>
              </div>
            </div>
            <div className="hidden md:flex items-center justify-center">
              <div className="w-80 h-80 rounded-3xl bg-gradient-to-br from-primary/20 to-emerald-500/20 flex items-center justify-center">
                <Heart className="h-32 w-32 text-primary/40" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-foreground mb-3">Contact Us</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Get in touch with our team</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="flex flex-col items-center p-6 bg-card border border-border rounded-2xl card-shadow">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <p className="font-medium text-card-foreground">Phone</p>
              <p className="text-sm text-muted-foreground mt-1">+91 9842705803</p>
            </div>
            <div className="flex flex-col items-center p-6 bg-card border border-border rounded-2xl card-shadow">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                <Mail className="h-6 w-6 text-emerald-500" />
              </div>
              <p className="font-medium text-card-foreground">Email</p>
              <p className="text-sm text-muted-foreground mt-1">vmsrkpm@gmail.com</p>
            </div>
            <div className="flex flex-col items-center p-6 bg-card border border-border rounded-2xl card-shadow">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6 text-purple-500" />
              </div>
              <p className="font-medium text-card-foreground">Address</p>
              <p className="text-sm text-muted-foreground mt-1 text-center">Kumarapalayam, Namakkal, Tamil Nadu, India </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Heart className="h-5 w-5" />
                <span className="font-bold text-lg">SSN Hospital</span>
              </div>
              <p className="text-sm opacity-70">Providing quality healthcare management solutions for hospitals and patients.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <div className="space-y-2 text-sm opacity-70">
                <p className="hover:opacity-100 cursor-pointer">Home</p>
                <p className="hover:opacity-100 cursor-pointer">About</p>
                <p className="hover:opacity-100 cursor-pointer">Doctors</p>
                <p className="hover:opacity-100 cursor-pointer">Contact</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-lg bg-background/10 flex items-center justify-center hover:bg-background/20 cursor-pointer transition-colors">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="w-9 h-9 rounded-lg bg-background/10 flex items-center justify-center hover:bg-background/20 cursor-pointer transition-colors">
                  <Phone className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-background/10 mt-8 pt-8 text-center text-sm opacity-50">
            © 2026 SSN Hospital. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HospitalLanding;
