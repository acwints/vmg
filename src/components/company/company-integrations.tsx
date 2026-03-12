"use client";

import {
  shopifyMetrics,
  amazonMetrics,
  netsuiteMetrics,
  tripleWhaleMetrics,
  stripeMetrics,
  hubspotMetrics,
} from "@/lib/mock-metrics";
import { IntegrationCard, MetricRow } from "./integration-card";

interface CompanyIntegrationsProps {
  companyName: string;
  isConsumer: boolean;
}

export function CompanyIntegrations({ companyName, isConsumer }: CompanyIntegrationsProps) {
  const shopify = isConsumer ? shopifyMetrics(companyName) : null;
  const amazon = isConsumer ? amazonMetrics(companyName) : null;
  const netsuite = isConsumer ? netsuiteMetrics(companyName) : null;
  const tripleWhale = isConsumer ? tripleWhaleMetrics(companyName) : null;
  const stripe = !isConsumer ? stripeMetrics(companyName) : null;
  const hubspot = !isConsumer ? hubspotMetrics(companyName) : null;

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Integrations
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {shopify && (
          <IntegrationCard
            logo="https://www.google.com/s2/favicons?domain=shopify.com&sz=128"
            name="Shopify"
            status="Connected"
          >
            <MetricRow label="Monthly Revenue" value={shopify.monthlyRevenue} accent />
            <MetricRow label="Orders" value={shopify.orders} />
            <MetricRow label="AOV" value={shopify.aov} />
            <MetricRow label="Conversion Rate" value={shopify.conversionRate} />
            <MetricRow label="Returning Customers" value={shopify.returningCustomers} />
            <MetricRow label="Top Channel" value={shopify.topChannel} />
          </IntegrationCard>
        )}

        {amazon && (
          <IntegrationCard
            logo="https://www.google.com/s2/favicons?domain=amazon.com&sz=128"
            name="Amazon Seller Central"
            status="Connected"
          >
            <MetricRow label="Best Seller Rank" value={amazon.bsr} />
            <MetricRow label="Monthly Units" value={amazon.monthlyUnits} />
            <MetricRow label="Rating" value={amazon.rating + " / 5.0"} />
            <MetricRow label="Reviews" value={amazon.reviews} />
            <MetricRow label="Buy Box %" value={amazon.buyBoxPct} />
            <MetricRow label="Ad Spend (mo)" value={amazon.adSpend} />
          </IntegrationCard>
        )}

        {netsuite && (
          <IntegrationCard
            logo="https://www.google.com/s2/favicons?domain=netsuite.com&sz=128"
            name="NetSuite"
            status="Connected"
          >
            <MetricRow label="Net Revenue" value={netsuite.netRevenue} accent />
            <MetricRow label="YoY Growth" value={netsuite.yoyGrowth} accent />
            <MetricRow label="Gross Margin" value={netsuite.grossMargin} />
            <MetricRow label="COGS" value={netsuite.cogs} />
            <MetricRow label="Cash on Hand" value={netsuite.cashOnHand} />
            <MetricRow label="AR Days" value={netsuite.arDays} />
          </IntegrationCard>
        )}

        {tripleWhale && (
          <IntegrationCard
            logo="https://www.google.com/s2/favicons?domain=triplewhale.com&sz=128"
            name="Triple Whale"
            status="Connected"
          >
            <MetricRow label="Blended ROAS" value={tripleWhale.blendedRoas} accent />
            <MetricRow label="Ad Spend (mo)" value={tripleWhale.adSpend} />
            <MetricRow label="New Customer ROAS" value={tripleWhale.ncRoas} />
            <MetricRow label="MER" value={tripleWhale.mer} />
            <MetricRow label="CAC" value={tripleWhale.cac} />
            <MetricRow label="LTV" value={tripleWhale.ltv} />
          </IntegrationCard>
        )}

        {stripe && (
          <IntegrationCard
            logo="https://www.google.com/s2/favicons?domain=stripe.com&sz=128"
            name="Stripe"
            status="Connected"
          >
            <MetricRow label="MRR" value={stripe.mrr} accent />
            <MetricRow label="ARR" value={stripe.arr} accent />
            <MetricRow label="Customers" value={stripe.customers} />
            <MetricRow label="Churn Rate" value={stripe.churnRate} />
            <MetricRow label="ARPU" value={stripe.arpu} />
            <MetricRow label="Net Revenue Retention" value={stripe.nrr} />
          </IntegrationCard>
        )}

        {hubspot && (
          <IntegrationCard
            logo="https://www.google.com/s2/favicons?domain=hubspot.com&sz=128"
            name="HubSpot"
            status="Connected"
          >
            <MetricRow label="Deals in Pipeline" value={String(hubspot.dealsInPipeline)} accent />
            <MetricRow label="Pipeline Value" value={hubspot.pipelineValue} accent />
            <MetricRow label="Avg Deal Size" value={hubspot.avgDealSize} />
            <MetricRow label="Win Rate" value={hubspot.winRate} />
            <MetricRow label="Avg Sales Cycle" value={hubspot.avgSalesCycle} />
            <MetricRow label="Top Stage" value={hubspot.topStage} />
          </IntegrationCard>
        )}
      </div>
    </section>
  );
}
