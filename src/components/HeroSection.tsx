import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import MotorcycleScene from "@/components/MotorcycleScene"; // Adjust path as needed
import React from 'react';

const HeroSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* 3D Scene as the background */}
      <div className="absolute top-0 left-0 w-full h-full z-0">
        <MotorcycleScene />
      </div>

      {/* Gradient overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/60"></div>

      {/* Content remains on top */}
      <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
        <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary-glow bg-clip-text text-transparent animate-glow">
          OnTwoWheelz
        </h1>
        <p className="text-xl md:text-2xl text-foreground/90 mb-8 max-w-2xl mx-auto">
          Connect with fellow riders, plan epic journeys, and discover the world's most thrilling motorcycle routes.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="hero"
            size="lg"
            onClick={() => navigate("/register")}
            className="text-lg px-8 py-6"
          >
            Start Your Journey
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button
            variant="glass"
            size="lg"
            onClick={() => navigate("/login")}
            className="text-lg px-8 py-6"
          >
            I'm Already Riding
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;