'use client'
import { ShieldCheck, Users, FileText, AlertTriangle, Ban, CheckCircle, Mail, BookOpen, Scale, Heart } from 'lucide-react'

const LAST_UPDATED = 'June 2025'

const sections = [
  {
    icon: <Heart size={20} color="#3b82f6" />,
    title: '1. Our Mission',
    content: `Civil Base is a professional community built exclusively for civil engineers, structural engineers, geotechnical engineers, and related construction professionals. Our mission is to foster a high-quality, respectful, and educational environment where engineers can share knowledge, discuss technical problems, and grow together as a profession.

By using Civil Base, you agree to uphold the standards of this community and contribute positively to the collective knowledge of our field.`,
  },
  {
    icon: <CheckCircle size={20} color="#10b981" />,
    title: '2. What We Encourage',
    content: `We welcome and encourage the following types of content:

• Technical questions and discussions about civil, structural, geotechnical, composite, and related engineering topics
• Sharing of relevant research papers, code references, standards (e.g. AS, EN, ACI, AISC), and design data
• Professional experience and lessons learned from real projects
• Constructive peer review and technical feedback on engineering approaches
• Educational content such as calculation examples, design workflows, and methodology comparisons
• Career advice, professional development, and industry insights relevant to civil engineering`,
  },
  {
    icon: <Ban size={20} color="#ef4444" />,
    title: '3. Prohibited Content',
    content: `The following content is strictly prohibited on Civil Base:

• Spam, self-promotion, or advertising unrelated to civil engineering
• Misinformation, fabricated data, or unverified engineering claims presented as fact
• Offensive, discriminatory, or harassing language targeting individuals or groups
• Content that violates copyright or intellectual property rights
• Personal attacks, trolling, or deliberately inflammatory posts
• Sharing of confidential project data, client information, or proprietary documents without authorisation
• Off-topic content unrelated to civil engineering or the professional community
• Explicit, violent, or otherwise inappropriate media
• Content that could endanger public safety by promoting unsafe engineering practices`,
  },
  {
    icon: <AlertTriangle size={20} color="#f59e0b" />,
    title: '4. Sensitive Content',
    content: `Some content may be technically relevant but requires special care:

• Discussions of structural failures or disasters — present these factually and professionally, not sensationally
• Controversial engineering opinions — clearly label these as personal views, not established standards
• Incomplete or preliminary calculations — clearly state limitations and do not present as final design outputs
• Content involving regulatory or legal matters — always recommend consulting qualified professionals

Posts flagged as sensitive may receive a warning even if not explicitly prohibited. When in doubt, include appropriate disclaimers.`,
  },
  {
    icon: <Users size={20} color="#8b5cf6" />,
    title: '5. Professional Conduct',
    content: `Civil Base is a professional space. We expect all members to:

• Communicate respectfully, even when disagreeing on technical matters
• Acknowledge the contributions and expertise of others
• Be honest about your qualifications and experience
• Not misrepresent yourself as a licensed professional if you are not
• Treat junior engineers and students with patience and encouragement
• Avoid condescending language — every engineer started somewhere

Remember that your posts reflect on you as a professional. Conduct yourself as you would at a conference or peer review.`,
  },
  {
    icon: <Scale size={20} color="#0369a1" />,
    title: '6. Warning System & Enforcement',
    content: `Civil Base uses a transparent 3-strike warning system to enforce these guidelines:

Strike 1 — Warning issued: You will receive a formal notification explaining what violated our guidelines and why. Your post may or may not be removed depending on severity.

Strike 2 — Final warning: A second violation results in a final warning. Your account will be flagged for closer review and further violations will result in a ban.

Strike 3 — Account ban: Three warnings result in a permanent ban from Civil Base. Banned accounts cannot post, comment, or interact with the community.

Warnings automatically expire after 14 days of good standing. Severe violations (e.g. deliberate misinformation that could cause engineering harm, harassment, or illegal content) may result in an immediate ban without prior warnings.

You can appeal a warning or ban by contacting our moderation team at the address below.`,
  },
  {
    icon: <FileText size={20} color="#64748b" />,
    title: '7. Content Ownership & Privacy',
    content: `By posting on Civil Base, you grant us a non-exclusive licence to display and distribute your content within the platform. You retain ownership of your original content.

Do not post:
• Personal information of others without their consent
• Confidential client, project, or employer information
• Calculation outputs or design documents from projects you do not have rights to share

Civil Base respects your privacy. We do not sell your personal data to third parties. Please review our Privacy Policy for full details on how we collect and use your information.`,
  },
  {
    icon: <BookOpen size={20} color="#059669" />,
    title: '8. Quality Standards',
    content: `To maintain Civil Base as a high-quality technical resource:

• Ensure your posts are clear, accurate, and add genuine value to the community
• Cite sources when referencing standards, codes, or research — include edition/year where possible
• For calculation examples, state assumptions and applicable standards clearly
• Use appropriate technical language while remaining accessible
• Tag posts with the correct category (Concrete, Steel, Composite, Geotechnical, or Others)
• Mark your post as a Question if you are seeking answers or technical assistance

Low-quality, vague, or repetitive posts may be removed without warning.`,
  },
  {
    icon: <ShieldCheck size={20} color="#0369a1" />,
    title: '9. Verification & Credentials',
    content: `Civil Base offers a verification badge for licensed and practising professionals. Verification:

• Requires submission of supporting documentation (licence, registration, degree)
• Is reviewed manually by our team
• May be revoked if misrepresentation is discovered

Unverified members are welcome and valued — verification is optional and does not affect your ability to post or participate. However, misrepresenting your credentials is a serious violation and will result in immediate removal of verification and may result in account suspension.`,
  },
  {
    icon: <Mail size={20} color="#64748b" />,
    title: '10. Contact & Appeals',
    content: `If you believe a warning or moderation action was applied in error, or if you wish to report content that violates these guidelines, please contact us:

• Use the Send Feedback option in the app to submit a support ticket
• Include the relevant post link and a brief explanation of your concern
• Our moderation team will review all appeals within 3–5 business days

We are committed to fair and transparent moderation. Our goal is not to restrict conversation but to ensure Civil Base remains a trusted, professional space for the engineering community.

Civil Base reserves the right to update these guidelines at any time. Continued use of the platform constitutes acceptance of the current guidelines.`,
  },
]

export default function GuidelinesPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>

      {/* Top bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e4e6eb', height: 56, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 100 }}>
        <a href="/feed" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <img src="/logo.png" alt="Civil Base" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
          <span style={{ fontSize: 16, fontWeight: 800, color: '#1e3a5f' }}>Civil Base</span>
        </a>
        <span style={{ color: '#d1d5db' }}>/</span>
        <span style={{ fontSize: 15, fontWeight: 600, color: '#65676b' }}>Community Guidelines</span>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 20px 60px' }}>

        {/* Hero */}
        <div style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 60%, #7c3aed 100%)', borderRadius: 16, padding: '40px 40px 36px', marginBottom: 32, color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={28} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 900, margin: 0 }}>Community Guidelines</h1>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 3 }}>Last updated: {LAST_UPDATED}</div>
            </div>
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: 'rgba(255,255,255,0.88)', margin: 0 }}>
            Civil Base is a professional knowledge-sharing platform for civil engineers. These guidelines exist to protect the quality, safety, and integrity of our community. By using Civil Base, you agree to abide by the standards described below.
          </p>
        </div>

        {/* Quick summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
          {[
            { icon: '✅', label: 'Be professional', sub: 'Communicate as you would at a peer review' },
            { icon: '🎯', label: 'Stay on topic', sub: 'Civil engineering content only' },
            { icon: '⚠️', label: '3-strike policy', sub: '3 warnings results in a permanent ban' },
          ].map(c => (
            <div key={c.label} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e4e6eb', padding: '16px', textAlign: 'center' as const }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{c.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>{c.label}</div>
              <div style={{ fontSize: 12, color: '#65676b', lineHeight: 1.4 }}>{c.sub}</div>
            </div>
          ))}
        </div>

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {sections.map(s => (
            <div key={s.title} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e4e6eb', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f2f5', display: 'flex', alignItems: 'center', gap: 10 }}>
                {s.icon}
                <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: 0 }}>{s.title}</h2>
              </div>
              <div style={{ padding: '16px 20px' }}>
                {s.content.split('\n').map((line, i) => (
                  line.trim() === '' ? <div key={i} style={{ height: 8 }} /> :
                  line.startsWith('•') ? (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                      <span style={{ color: '#3b82f6', flexShrink: 0, marginTop: 1 }}>•</span>
                      <span style={{ fontSize: 14, color: '#374151', lineHeight: 1.65 }}>{line.slice(1).trim()}</span>
                    </div>
                  ) : line.startsWith('Strike') ? (
                    <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', marginBottom: 8 }}>
                      <span style={{ fontSize: 14, color: '#374151', lineHeight: 1.65, fontWeight: 600 }}>{line}</span>
                    </div>
                  ) : (
                    <p key={i} style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, margin: '0 0 4px' }}>{line}</p>
                  )
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        <div style={{ marginTop: 32, background: '#fff', borderRadius: 12, border: '1px solid #e4e6eb', padding: '24px', textAlign: 'center' as const }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Questions or concerns?</div>
          <div style={{ fontSize: 14, color: '#65676b', marginBottom: 16, lineHeight: 1.6 }}>
            If you have questions about these guidelines or need to appeal a moderation decision, use the <strong>Send Feedback</strong> option in the app.
          </div>
          <a href="/feed" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 24px', borderRadius: 8, background: '#3b82f6', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
            Back to Civil Base
          </a>
        </div>

      </div>
    </div>
  )
}
