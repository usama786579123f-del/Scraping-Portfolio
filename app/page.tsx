import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import { TechStack, Services, Stats, Process, Principles } from "@/components/Sections";
import Projects from "@/components/Projects";
import { AboutContact, Footer } from "@/components/Footer";

export default function Page() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <TechStack />
        <Services />
        <Projects />
        <Stats />
        <Process />
        <Principles />
        <AboutContact />
      </main>
      <Footer />
    </>
  );
}
