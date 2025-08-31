import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Mountain, MapPin, Users, Trophy, ArrowRight, Bike} from "lucide-react";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import heroImage from "@/assets/hero-adventure2.png";
import logo from "@/assets/edit2.png";


// Testimonials type
type Testimonial = {
  text: string;
  image: string;
  name: string;
  role: string;
};

const Landing = () => {
  const navigate = useNavigate();

  // Testimonials data for motorcycle riders
  const testimonials: Testimonial[] = [
    {
      text: "OnTwoWheelz completely transformed my riding experience. I found amazing riding buddies and discovered routes I never knew existed. The community is incredible!",
      image: "https://randomuser.me/api/portraits/men/1.jpg",
      name: "Rajesh Kumar",
      role: "Adventure Rider",
    },
    {
      text: "Planning trips has never been easier. The platform connected me with fellow riders who share my passion for off-road adventures. Highly recommend!",
      image: "https://randomuser.me/api/portraits/women/2.jpg",
      name: "Priya Sharma",
      role: "Touring Enthusiast",
    },
    {
      text: "The support team is exceptional and the app is incredibly user-friendly. I've made lifelong friends through this platform.",
      image: "https://randomuser.me/api/portraits/men/3.jpg",
      name: "Amit Patel",
      role: "Moto Blogger",
    },
    {
      text: "OnTwoWheelz revolutionized how I connect with the riding community. The features are intuitive and the routes are spectacular.",
      image: "https://randomuser.me/api/portraits/women/4.jpg",
      name: "Sneha Reddy",
      role: "Sports Bike Rider",
    },
    {
      text: "This platform has boosted my riding adventures significantly. The community support and route planning tools are outstanding.",
      image: "https://randomuser.me/api/portraits/men/5.jpg",
      name: "Vikram Singh",
      role: "Mountain Rider",
    },
    {
      text: "Implementation was smooth and the interface exceeded my expectations. It streamlined my riding planning perfectly.",
      image: "https://randomuser.me/api/portraits/women/6.jpg",
      name: "Kavita Jain",
      role: "Long Distance Rider",
    },
    {
      text: "Our riding group improved significantly with this platform. The user-friendly design and community features are fantastic.",
      image: "https://randomuser.me/api/portraits/men/7.jpg",
      name: "Arun Gupta",
      role: "Group Ride Organizer",
    },
    {
      text: "They delivered a solution that exceeded all expectations, understanding rider needs and enhancing our adventures.",
      image: "https://randomuser.me/api/portraits/women/8.jpg",
      name: "Meera Joshi",
      role: "Cruiser Rider",
    },
    {
      text: "Using OnTwoWheelz, our riding experiences and connections significantly improved, boosting our motorcycle adventures.",
      image: "https://randomuser.me/api/portraits/men/9.jpg",
      name: "Rohan Mehta",
      role: "Vintage Bike Collector",
    },
  ];

  const firstColumn = testimonials.slice(0, 3);
  const secondColumn = testimonials.slice(3, 6);
  const thirdColumn = testimonials.slice(6, 9);

  const features = [
    {
      icon: MapPin,
      title: "Epic Route Planning",
      description: "Discover and plan the most scenic and thrilling motorcycle routes around the world.",
      color: "from-primary to-primary-glow",
      delay: "0ms"
    },
    {
      icon: Users,
      title: "Riding Community",
      description: "Connect with passionate riders, share experiences, and find your perfect riding companions.",
      color: "from-primary to-accent",
      delay: "100ms"
    },
    {
      icon: Trophy,
      title: "Achievement System",
      description: "Track your adventures, earn badges, and compete with fellow riders on epic challenges.",
      color: "from-accent to-primary",
      delay: "200ms"
    },
    {
      icon: Bike,
      title: "Additional Features",
      description: "Roadside help, trip insurance, verified food & stays.",
      color: "from-primary to-secondary",
      delay: "200ms"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-end overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
        </div>
        
                <div className="relative z-10 text-right max-w-4xl mr-8 px-4">
          <h1 className="text-7xl md:text-9xl font-bold mb-8 drop-shadow-lg">
            <span className="text-red-600">On</span><span className="text-white">TwoWheelz</span>
          </h1>
          <p className="text-2xl md:text-3xl text-white mb-10 max-w-2xl mx-auto font-medium">
            Connect with fellow riders, plan epic journeys, and discover the world's most thrilling motorcycle routes.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-end">
            <Button
              variant="hero"
              size="lg"
              onClick={() => navigate("/register")}
              className="text-xl px-10 py-8"
            >
              Start Your Journey
              <ArrowRight className="ml-2 h-6 w-6" />
            </Button>
            <Button
              variant="glass"
              size="lg"
              onClick={() => navigate("/login")}
              className="text-xl px-10 py-8 text-white bg-black/60 backdrop-blur-md border-white/30 hover:bg-black/80"
            >
              I'm Already Riding
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-background my-20 relative">
        <div className="container z-10 mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="flex flex-col items-center justify-center max-w-[540px] mx-auto"
          >
            <div className="flex justify-center">
              <div className="border py-1 px-4 rounded-lg">Testimonials</div>
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tighter mt-5">
              What our riders say
            </h2>
            <p className="text-center mt-5 opacity-75">
              See what our motorcycle community has to say about us.
            </p>
          </motion.div>

          <div className="flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[740px] overflow-hidden">
            <TestimonialsColumn testimonials={firstColumn} duration={15} />
            <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={19} />
            <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={17} />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-background relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_hsl(var(--primary))_0%,_transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_hsl(var(--accent))_0%,_transparent_50%)]"></div>
        </div>

        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-20">
            <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tighter mt-5 mb-5">
              Why Riders Choose Us
            </div>

            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-4">
              Built by riders, for riders — explore what makes AdventureRide the go-to platform for motorcyclists worldwide.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center max-w-7xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const isEven = index % 2 === 0;

             return (
                <div
                  key={index}
                  className={`group relative ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} flex flex-col lg:flex-row items-center gap-4 py-2`}
                  style={{ animationDelay: feature.delay }}
                >
                  {/* Icon Section */}
                  <div className="relative flex-shrink-0 px-4 py-2">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
                    <div className={`relative w-20 h-20 rounded-3xl bg-gradient-to-br ${feature.color} p-4 flex items-center justify-center shadow-deep group-hover:shadow-glow transition-all duration-500 group-hover:scale-110`}>
                      <Icon className="h-12 w-12 text-white drop-shadow-lg" />
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className={`flex-1 text-center lg:text-left ${!isEven ? 'lg:text-right' : ''}`}>
                    <h3 className="text-xl md:text-2xl font-bold mb-2 text-foreground group-hover:text-primary transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed mb-3">
                      {feature.description}
                    </p>
                  </div>
                </div>

              );
            })}
          </div>


        </div>
      </section>

      {/* CTA Section */}
     

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
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
          <p className="text-muted-foreground">
            © 2025 OnTwoWheelz. Built for riders, by riders.
          </p>
        </div>
      </footer>
    </div>
  );
};

// TestimonialsColumn component
const TestimonialsColumn = (props: {
  className?: string;
  testimonials: Testimonial[];
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.div
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop" as const,
        }}
        className="flex flex-col gap-6 pb-6 bg-background"
      >
        {[
          ...new Array(2).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {props.testimonials.map(({ text, image, name, role }, i) => (
                <div className="p-10 rounded-3xl border shadow-lg shadow-primary/10 max-w-xs w-full" key={i}>
                  <div>{text}</div>
                  <div className="flex items-center gap-2 mt-5">
                    <img
                      width={40}
                      height={40}
                      src={image}
                      alt={name}
                      className="h-10 w-10 rounded-full"
                    />
                    <div className="flex flex-col">
                      <div className="font-medium tracking-tight leading-5">{name}</div>
                      <div className="leading-5 opacity-60 tracking-tight">{role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </React.Fragment>
          )),
        ]}
      </motion.div>
    </div>
  );
};

export default Landing;
