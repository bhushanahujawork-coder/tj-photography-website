import Navbar from '@/components/home/navbar'
import HeroSection from '@/components/home/hero-section'
import Statistics from '@/components/home/statistics'
import MasonryPortfolio from '@/components/home/masonry-portfolio'
import SoulCinema from '@/components/home/soul-cinema'
import ContactSection from '@/components/home/contact-section'
import Footer from '@/components/home/footer'
import WhatsappFloat from '@/components/home/whatsapp-float'

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <Statistics />
        <MasonryPortfolio />
        <SoulCinema />
        <ContactSection />
      </main>
      <Footer />
      <WhatsappFloat />
    </>
  )
}
