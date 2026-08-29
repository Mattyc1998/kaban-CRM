import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Svg,
  Circle,
  Defs,
  LinearGradient,
  Stop,
} from "@react-pdf/renderer";
import type { Proposal } from "@prisma/client";

const ORANGE = "#ea7c17";
const ORANGE_LIGHT = "#fbbf5c";
const INK = "#1a1a1a";
const MUTED = "#6b6b6b";
const BORDER = "#e2e2e2";

const styles = StyleSheet.create({
  page: {
    paddingTop: 56,
    paddingBottom: 56,
    paddingHorizontal: 56,
    fontSize: 10.5,
    color: INK,
    fontFamily: "Helvetica",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 32,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 13,
    letterSpacing: 0.3,
  },
  docLabel: {
    fontSize: 9,
    color: MUTED,
    textAlign: "right",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  docDate: {
    fontSize: 9,
    color: MUTED,
    textAlign: "right",
    marginTop: 2,
  },
  titleBlock: {
    borderBottomWidth: 2,
    borderBottomColor: ORANGE,
    paddingBottom: 16,
    marginBottom: 24,
  },
  title: {
    fontFamily: "Helvetica-Bold",
    fontSize: 20,
    marginBottom: 6,
  },
  preparedFor: {
    fontSize: 10,
    color: MUTED,
  },
  section: {
    marginBottom: 22,
  },
  sectionLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: ORANGE,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  scopeText: {
    fontSize: 10.5,
    lineHeight: 1.6,
    color: INK,
  },
  priceBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#faf6f0",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  priceLabel: {
    fontSize: 10,
    color: MUTED,
  },
  priceValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 18,
  },
  signatureBlock: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#b9e4c9",
    backgroundColor: "#f0faf3",
    borderRadius: 4,
    padding: 14,
  },
  signatureTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10.5,
    color: "#1f7a45",
    marginBottom: 3,
  },
  signatureMeta: {
    fontSize: 9,
    color: MUTED,
  },
  pendingBlock: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: BORDER,
    borderStyle: "dashed",
    borderRadius: 4,
    padding: 14,
  },
  pendingText: {
    fontSize: 9.5,
    color: MUTED,
  },
  expiredBlock: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#f5cf8a",
    backgroundColor: "#fdf6e8",
    borderRadius: 4,
    padding: 12,
  },
  expiredText: {
    fontSize: 9.5,
    color: "#8a5a00",
  },
  footer: {
    position: "absolute",
    bottom: 32,
    left: 56,
    right: 56,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 8,
    color: MUTED,
  },
});

function RingMark() {
  return (
    <Svg width={16} height={16} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id="ring" x1="8" y1="6" x2="56" y2="58" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={ORANGE_LIGHT} />
          <Stop offset="1" stopColor={ORANGE} />
        </LinearGradient>
      </Defs>
      <Circle cx={32} cy={32} r={22.5} stroke="url(#ring)" strokeWidth={5} fill="none" />
    </Svg>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(
    date
  );
}

function reference(id: string) {
  return id.slice(-8).toUpperCase();
}

export function ProposalDocument({ proposal }: { proposal: Proposal }) {
  const clientLine = [proposal.clientCompany, proposal.clientName].filter(Boolean).join(" — ");
  const isPending = proposal.status === "DRAFT" || proposal.status === "SENT";
  const isExpired = isPending && proposal.validUntil != null && proposal.validUntil < new Date();

  return (
    <Document title={`${proposal.title} — Proposal`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.brandRow}>
            <RingMark />
            <Text style={styles.brandName}>ClearFlow AI</Text>
          </View>
          <View>
            <Text style={styles.docLabel}>Proposal #{reference(proposal.id)}</Text>
            <Text style={styles.docDate}>{formatDate(proposal.createdAt)}</Text>
            {proposal.validUntil && (
              <Text style={styles.docDate}>Valid until {formatDate(proposal.validUntil)}</Text>
            )}
          </View>
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.title}>{proposal.title}</Text>
          {clientLine && <Text style={styles.preparedFor}>Prepared for {clientLine}</Text>}
        </View>

        {isExpired && (
          <View style={styles.expiredBlock}>
            <Text style={styles.expiredText}>
              This proposal&rsquo;s validity date has passed — contact us for an updated quote before
              signing.
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Scope of Work</Text>
          <Text style={styles.scopeText}>{proposal.scope}</Text>
        </View>

        {proposal.price != null && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Investment</Text>
            <View style={styles.priceBox}>
              <Text style={styles.priceLabel}>Total price</Text>
              <Text style={styles.priceValue}>£{proposal.price.toLocaleString("en-GB")}</Text>
            </View>
          </View>
        )}

        {proposal.paymentTerms && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Payment Terms</Text>
            <Text style={styles.scopeText}>{proposal.paymentTerms}</Text>
          </View>
        )}

        {proposal.clientProvides && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>What We Need From You</Text>
            <Text style={styles.scopeText}>{proposal.clientProvides}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Next Steps</Text>
          <Text style={styles.scopeText}>
            1. Review the scope, price, and terms above.{"\n"}
            2. Sign electronically via the link this proposal was shared on.{"\n"}
            3. We&rsquo;ll confirm your kick-off date within 1 business day of signing.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Acceptance</Text>
          {proposal.status === "SIGNED" ? (
            <View style={styles.signatureBlock}>
              <Text style={styles.signatureTitle}>Signed &amp; Accepted</Text>
              <Text style={styles.signatureMeta}>
                Signed by {proposal.signedName}
                {proposal.signedAt ? ` on ${formatDate(proposal.signedAt)}` : ""}
              </Text>
            </View>
          ) : proposal.status === "DECLINED" ? (
            <View style={styles.pendingBlock}>
              <Text style={styles.pendingText}>This proposal was declined.</Text>
            </View>
          ) : (
            <View style={styles.pendingBlock}>
              <Text style={styles.pendingText}>
                Awaiting client signature — view and sign online at the link provided.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>ClearFlow AI</Text>
          <Text style={styles.footerText}>{proposal.title}</Text>
        </View>
      </Page>
    </Document>
  );
}
