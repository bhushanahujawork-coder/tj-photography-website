import Navbar from '@/components/home/navbar'
import HeroSection from '@/components/home/hero-section'
import Statistics from '@/components/home/statistics'
import MasonryPortfolio from '@/components/home/masonry-portfolio'
import SoulCinema from '@/components/home/soul-cinema'
import Reviews from '@/components/home/reviews'
import ContactSection from '@/components/home/contact-section'
import Footer from '@/components/home/footer'
import WhatsappFloat from '@/components/home/whatsapp-float'
import ScrollProgress from '@/components/home/scroll-progress'

export default function Home() {
  return (
    <>
      <ScrollProgress />
      <Navbar />
      <main>
        <HeroSection />
        <Statistics />
        <MasonryPortfolio />
        <SoulCinema />
        <Reviews />
        <ContactSection />
      </main>
      <Footer />
      <WhatsappFloat />
    </>
  )
}
