export default function PrivacyPolicy() {
    return (
        <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-8">Privacy Policy</h1>

            <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
                <section>
                    <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
                    <p className="text-muted-foreground">
                        Welcome to AI Counsellor. We value your privacy and are committed to protecting your personal data.
                        This Privacy Policy explains how we collect, use, disclosure, and safeguard your information when you visit our website
                        and use our AI-powered counseling services.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
                    <p className="text-muted-foreground mb-4">
                        We collect information that you strictly provide to us when you register for an account,
                        update your profile, or use our services. This may include:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                        <li>Personal identification information (Name, email address, phone number).</li>
                        <li>Academic history and preferences (GPA, test scores, preferred universities).</li>
                        <li>Information related to your study abroad journey and interactions with our AI counselor.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
                    <p className="text-muted-foreground">
                        We use the collected data to provide, operate, and maintain our services, including:
                    </p>
                    <ul className="list-disc pl-6 mp-4 space-y-2 text-muted-foreground">
                        <li>Personalizing your experience and providing tailored university recommendations.</li>
                        <li>Improving our AI algorithms and service functionality.</li>
                        <li>Communicating with you regarding your account, updates, and promotional offers (if you opted in).</li>
                        <li>Processing your requests and managing your study abroad roadmap.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
                    <p className="text-muted-foreground">
                        We implement appropriate technical and organizational security measures to protect your personal information.
                        However, please note that no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold mb-4">5. Contact Us</h2>
                    <p className="text-muted-foreground">
                        If you have any questions about this Privacy Policy, please contact us at amarmahakal92@gmail.com.
                    </p>
                </section>

                <p className="text-sm text-muted-foreground mt-8">
                    Last updated: {new Date().toLocaleDateString()}
                </p>
            </div>
        </div>
    );
}
