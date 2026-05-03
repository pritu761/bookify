import Image from 'next/image'
import Link from 'next/link'
import { Plus } from 'lucide-react'

const steps = [
    {
        title: 'Upload PDF',
        description: 'Add your book file',
    },
    {
        title: 'AI Processing',
        description: 'We analyze the content',
    },
    {
        title: 'Voice Chat',
        description: 'Discuss with AI',
    },
]

const HeroSection = () => {
    return (
        <section className="mb-10 md:mb-16">
            <div className="library-hero-card">
                <div className="library-hero-content">
                    <div className="library-hero-text">
                        <h1 className="library-hero-title">Your Library</h1>
                        <p className="library-hero-description">
                            Convert your books into interactive AI conversations. <br className="hidden md:block" />
                            Listen, learn, and discuss your favorite reads.
                        </p>
                        <Link href="/books/new" className="library-cta-primary">
                            <Plus className="size-5" strokeWidth={2.4} aria-hidden="true" />
                            <span>Add new book</span>
                        </Link>
                    </div>

                    <div className="library-hero-illustration">
                        <Image
                            src="/assets/hero-illustration.png"
                            alt="Vintage books and a globe"
                            width={448}
                            height={280}
                            className="library-hero-image"
                            priority
                        />
                    </div>

                    <div className="library-steps-card">
                        <ul className="library-steps-list" aria-label="How Bookified works">
                            {steps.map((step, index) => (
                                <li className="library-step-item" key={step.title}>
                                    <span className="library-step-number">{index + 1}</span>
                                    <span className="library-step-copy">
                                        <span className="library-step-title">{step.title}</span>
                                        <span className="library-step-description">{step.description}</span>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default HeroSection
