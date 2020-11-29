---
title: "Azure Key Vault の監査とログ"
weight: 20
date: 2019-10-27
description: "この記事はトピック「Azure上でセキュアなアプリケーションを作るベストプラクティス」の中の一記事となります。本稿は、Key Vault の特徴として監査とログについて紹介します。"
authors: [
    ["Takekazu Omi","images/author/omi.png"],
    ["Keiichi Hashimoto","images/author/k1hash.png"]
]
type : "article"
category : "azure"
tags: ["Azure", "セキュリティ","KeyVault"]
eyecatch: "images/eyecatch/keyvault.png"
---

## はじめに

この記事はトピック[「Azure上でセキュアなアプリケーションを作るベストプラクティス」](/azure/security/)の中の一記事となります。

本稿は、Microsoft Azureで、アプリケーションで使われるセンシティブ情報(パスワード等)の保護のベストプラクティスとして情報をKey Vaultに保存する利点を論じています。そして、[Key Vault](https://docs.microsoft.com/en-in/azure/key-vault/key-vault-overview)の利点を構成する重要な点として、監査とログについて記述します。

## 監査

Key Vaultの２つめの特徴は、[監査ログ](https://docs.microsoft.com/ja-jp/azure/key-vault/key-vault-logging#loganalytics)と監視([Azure Monitor Alerts](https://docs.microsoft.com/en-us/azure/azure-monitor/learn/tutorial-response))です。最新のKey Vaultでは、[Log Analytics（Azure Monitor Log)](https://docs.microsoft.com/ja-jp/azure/azure-monitor/insights/azure-key-vault#enable-key-vault-diagnostics-in-the-portal)に直接、Key Vaultのアクセスログを保存可能です。保存したログをKQLでクエリーしアラートを出す機能が用意されています。
Azure PortalでのKey Vaultの監査ログの分析を支援する[Key Vault Analytics](https://azuremarketplace.microsoft.com/en-usrketplace/marketplace/apps/Microsoft.KeyVaultAnalyticsOMS?tab=Overview)ソリューションも用意されています。Key Vault Analyticsでは下記のように表示されます。

{{< figure src="../images/screen01.png" title="図10 Key Vault Analytics" width="800" >}}

監査ログをLog Analyticsに保存すると、KQLを使って、呼び出し元のIPの一覧を確認したり。

```SQL
AzureDiagnostics
| where ResourceProvider =="MICROSOFT.KEYVAULT" and Category == "AuditEvent"
| sort by TimeGenerated desc
| summarize AggregatedValue = count() by CallerIPAddress
```

{{< figure src="../images/screen02.png" title="図11 KQL CallerIPAddress" width="800" >}}

エラーになった呼び出しを確認するなど自由度の高い参照ができます。

```SQL
AzureDiagnostics
| where ResourceProvider =="MICROSOFT.KEYVAULT" and Category == "AuditEvent" 
    and httpStatusCode_d >= 300 
    and not(OperationName == "Authentication" and httpStatusCode_d == 401)
| sort by TimeGenerated desc
| summarize AggregatedValue = count() by ResultSignature
```

{{< figure src="../images/screen03.png" title="図12 KQL httpStatusCode" width="800" >}}

また、上記のクエリを少し加工（アグリゲーション部分を削除して）したクエリを使ってAlertを設定することもできます。[Respond to events with Azure Monitor Alerts](https://docs.microsoft.com/en-us/azure/azure-monitor/learn/tutorial-response)

アグリゲーション部分を削除したのは、Azure Monitor の Alert エンジンで、期間、スレッショルドの処理を行うためです。ログ検索クエリーとしては、summarize を行うと二重の集計になってしまい期待した結果になりません。

```
AzureDiagnostics
| where ResourceProvider =="MICROSOFT.KEYVAULT" and Category == "AuditEvent" 
    and httpStatusCode_d >= 300 
    and not(OperationName == "Authentication" and httpStatusCode_d == 401)
```

{{< figure src="../images/screen08.png" title="図13 Azure Monitor Alert" width="800" >}}

このような監査と監視の仕組みを使えるのことが、Key Vaultの大きな利点です。これによって高度なデータの保護を実現しています。

## 最後に

Key Vault は、
最後に、注意すべき点を１つ。Key Vaultのセキュリティが高いからと言って、すべての設定情報を Key Vaultに入れるのはアンチパターンです。セキュリティは、アクセスが限定され監査が有効なことで保たれており、全部をKey Vaultに入れてしまうと、その前提が崩れてしまいます。センシティブ情報だけをKey Vaultに入れてください。

### 次の記事

- [Azure上でセキュアなアプリケーションを作るベストプラクティス](/azure/security/)
