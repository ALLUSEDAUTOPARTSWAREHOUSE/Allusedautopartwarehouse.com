import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

const siteUrl = 'https://allusedautopartwarehouse.com'
const supportEmail = 'support@auapw.com'
const orange = '#d97706'
const ink = '#17202a'
const muted = '#667085'

const styles = {
  body: { backgroundColor: '#f4f6f8', fontFamily: 'Arial, Helvetica, sans-serif', margin: 0, padding: '32px 12px' },
  container: { backgroundColor: '#ffffff', margin: '0 auto', maxWidth: '620px' },
  header: { backgroundColor: '#20262e', backgroundImage: `url(${siteUrl}/email/auapw-automotive-banner.png)`, backgroundPosition: 'center', backgroundSize: 'cover', padding: '28px 32px 34px' },
  logo: { backgroundColor: '#ffffff', borderRadius: '4px', display: 'block', padding: '7px', width: '170px' },
  eyebrow: { color: '#fbbf24', fontSize: '12px', fontWeight: '700', letterSpacing: '1.4px', margin: '30px 0 8px', textTransform: 'uppercase' as const },
  headerTitle: { color: '#ffffff', fontSize: '30px', fontWeight: '700', lineHeight: '1.12', margin: 0 },
  content: { padding: '34px 32px 28px' },
  heading: { color: ink, fontSize: '24px', lineHeight: '1.25', margin: '0 0 16px' },
  text: { color: '#344054', fontSize: '15px', lineHeight: '1.65', margin: '0 0 16px' },
  button: { backgroundColor: orange, borderRadius: '5px', color: '#ffffff', display: 'inline-block', fontSize: '14px', fontWeight: '700', padding: '13px 20px', textDecoration: 'none' },
  notice: { backgroundColor: '#fff8eb', borderLeft: `4px solid ${orange}`, color: '#7a4b00', fontSize: '14px', lineHeight: '1.55', margin: '22px 0', padding: '14px 16px' },
  footer: { color: muted, fontSize: '12px', lineHeight: '1.6', padding: '0 32px 30px' },
}

function EmailShell({ preview, eyebrow, title, children }: { preview: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Img src={`${siteUrl}/auapw-logo.png`} alt="All Used Auto Parts Warehouse" style={styles.logo} />
            <Text style={styles.eyebrow}>{eyebrow}</Text>
            <Heading style={styles.headerTitle}>{title}</Heading>
          </Section>
          <Section style={styles.content}>{children}</Section>
          <Hr style={{ borderColor: '#eaecf0', margin: '0 32px 24px' }} />
          <Text style={styles.footer}>
            All Used Auto Parts Warehouse<br />
            Need help? <Link href={`mailto:${supportEmail}`} style={{ color: orange }}>{supportEmail}</Link><br />
            <Link href={siteUrl} style={{ color: orange }}>Visit our parts catalog</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export function EmailVerification({ name = 'there', verificationUrl = `${siteUrl}/verify-email` }: { name?: string; verificationUrl?: string }) {
  return (
    <EmailShell preview="Verify your email to continue with your AUAPW order." eyebrow="Secure your order" title="Confirm your email address">
      <Heading as="h2" style={styles.heading}>Hi {name},</Heading>
      <Text style={styles.text}>Please verify your email address so we can keep your order details secure and send you accurate updates from our parts team.</Text>
      <Section style={{ margin: '26px 0' }}><Button href={verificationUrl} style={styles.button}>Verify email address</Button></Section>
      <Text style={styles.text}>This link is for your account only. If you did not start an order with AUAPW, you can safely ignore this message.</Text>
      <Text style={{ ...styles.notice, marginBottom: 0 }}>For your security, never share your verification link, password, or payment details by email.</Text>
    </EmailShell>
  )
}

export function OrderConfirmation({ customerName = 'there', orderNumber = 'AUAPW-00000', orderUrl = `${siteUrl}/account/orders`, items = ['Requested auto part'], total = 'To be confirmed' }: { customerName?: string; orderNumber?: string; orderUrl?: string; items?: string[]; total?: string }) {
  return (
    <EmailShell preview={`Order ${orderNumber} received — payment confirmation is still required.`} eyebrow="Order received" title="Your order is in review">
      <Heading as="h2" style={styles.heading}>Thanks, {customerName}.</Heading>
      <Text style={styles.text}>We received your request and our parts team is reviewing fitment and availability now.</Text>
      <Text style={styles.notice}><strong>Next step:</strong> Your order will be processed after payment confirmation. No payment has been captured yet.</Text>
      <Section style={{ backgroundColor: '#f8fafc', border: '1px solid #eaecf0', borderRadius: '4px', padding: '18px 20px' }}>
        <Text style={{ ...styles.text, fontWeight: '700', marginBottom: 10 }}>Order {orderNumber}</Text>
        {items.map((item) => <Text key={item} style={{ ...styles.text, marginBottom: 7 }}>• {item}</Text>)}
        <Hr style={{ borderColor: '#eaecf0' }} />
        <Text style={{ ...styles.text, fontWeight: '700', margin: '10px 0 0' }}>Estimated total: {total}</Text>
      </Section>
      <Section style={{ margin: '26px 0 8px' }}><Button href={orderUrl} style={styles.button}>View order details</Button></Section>
      <Text style={styles.text}>A parts specialist will contact you if we need to confirm fitment or payment. Product links and invoice details will be included in your account.</Text>
    </EmailShell>
  )
}

export default OrderConfirmation
