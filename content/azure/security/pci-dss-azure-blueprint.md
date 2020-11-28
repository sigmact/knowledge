---
title: "Azure Blueprint: PaaS Web Application for PCI DSS とは"
authors: [
    ["Takekazu Omi","images/author/omi.png"],
    ["Keiichi Hashimoto","images/author/k1hash.png"]
]
weight: 10
date: 2020-11-25
description: "本記事では、Azure 上で PCI DSS に対応するアーキテクチャを検討する上で、Microsoft が提供している「PCI DSS のための PaaS Web アプリケーション」を紹介します。"
type : "article"
category : "azure"
tags: ["Azure", "セキュリティ","PCI DSS"]
eyecatch: "azure/security/images/03-arch.png"
---

## はじめに

この記事は連載「Azure上でセキュアなアプリケーションを作るベストプラクティス」の中の一記事となります。
本記事では、Azure 上で PCI DSS に対応するアーキテクチャを検討する上で、Microsoft が提供している「PCI DSS のための PaaS Web アプリケーション」を紹介します。

## Blueprint: PaaS Web Application for PCI DSS とは

PCI DSS に対応するアーキテクチャをゼロから考える必要はありません。Microsoft から、[PCI DSS のための PaaS Web アプリケーション](https://docs.microsoft.com/ja-jp/azure/security/blueprints/pcidss-paaswa-overview)(以下 本システムと呼びます) というドキュメントが公開されており、我々もそれを参考にしています。

本システム は、下記のような構成になっています。我々が構築した実際のサイトは企業ネットワークとの ExpressRoute 接続があるなど、もっと複雑な構成ですが、基本的な考え⽅は同じです。

{{< figure src="../images/03-arch.png" title="図3 Azure PCI DSS アークテクチャー" width="600" >}}

本システム の構成を簡単に説明します。まず、システム全体は[仮想ネットワーク](https://docs.microsoft.com/ja-jp/azure/virtual-network/virtual-networks-overview)に展開されます。左側のフロントから説明すると、公開エンドポイントを Applicaiton Gateway + WAF で保護し、Internal LB 経由で、AppService Environment (ASE)に接続します。

アプリケーションは ASE に展開され、バックエンドの[SQL Database](https://azure.microsoft.com/en-in/services/sql-database/)にデータを保存します。データベースとの通信は、暗号化され、[Virtual Network Service Endpoints](https://docs.microsoft.com/en-us/azure/virtual-network/virtual-network-service-endpoints-overview) でエンドポイントを保護します。企業ネットワークとは[Express Route](https://azure.microsoft.com/ja-jp/services/expressroute/)で接続され、システム連携のため特定のシステム（システム連携相⼿）との通信を許可しています。また、運⽤管理⽤に踏み台サーバー(Bastion)が設置され、踏み台サーバーへのアクセスは Express Route 経由で特定の端末からのみのアクセスに制限された環境とします。そして、ログ、メトリックは、[Azure
Monitor](https://azure.microsoft.com/ja-jp/services/monitor/)に集約します。

システムは、仮想ネットワーク内の、[Network Security Group(NSG)](https://docs.microsoft.com/en-us/azure/virtual-network/security-overview)で保護されたサブネット内にコンポーネント毎に展開されます。

そして、NSG ではコンポーネント間の必要な通信だけを許可します。この分離⽅針は、PCI DSS で求められているものよりも厳格ですが、Azure では追加コストも低く容易に実装できるため積極的に活用しています。

本環境を構築するためのリソースは、GitHub で公開されています。[Securing PaaS deployments](https://docs.microsoft.com/en-us/azure/security/security-paas-deployments)。

### 次の記事

- [「認証、アクセス制御」Azureでの PCI DSS 対応をまとめる(1)](/azure/security/pci-dss-azure-authorized-access-control/)

- [Azure とセキュリティTOP](/azure/security/)


## 参考

セキュリティ関連のおすすめリンク（本文未掲載）

- [Azure Security Documentation](https://docs.microsoft.com/en-us/azure/security/)
- [Design for security in Azure](https://docs.microsoft.com/en-us/learn/modules/design-for-security-in-azure/)
