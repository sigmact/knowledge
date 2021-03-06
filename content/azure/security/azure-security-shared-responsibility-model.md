---
title: "Azureのセキュリティ「共有責任モデル」の利点とは"
authors: [
    ["Takekazu Omi","images/author/omi.png"],
    ["Keiichi Hashimoto","images/author/k1hash.png"]
]
weight: 10
date: 2020-11-24
description: "この記事はトピック「Azure上でセキュアなアプリケーションを作るベストプラクティス」の中の一記事となります。本記事では、まず基本として「情報セキュリティの定義」を紹介し、続いてAzureにおけるセキュリティの利点である「共有責任モデル」について説明します。"
type : "article"
category : "azure"
tags: ["Azure", "セキュリティ","PCI DSS"]
eyecatch: "azure/security/images/02-srmodel.png"
---

## はじめに

この記事はトピック[「Azure上でセキュアなアプリケーションを作るベストプラクティス」](/azure/security/)の中の一記事となります。
例として PCI DSS の要件を取り上げており、それぞれの要件と Azure での実装を解説していきます。

本記事では、まず基本知識として「情報セキュリティの定義」を紹介し、続いてAzureにおけるセキュリティの利点である **「共有責任モデル」** について説明します。

## 情報セキュリティの定義

情報セキュリティの定義は、頭⽂字を取って CIA として知られています。

- 機密性 (Confidentiality): 情報へのアクセスを認められた者だけが、アクセスできる状態とする
- 完全性 (Integrity): 情報が破壊、改ざん⼜は消去されていない状態を確保する
- 可⽤性 (Availability): 情報へのアクセスを認められた者が、必要時に中断することなく、情報及び関連資産にアクセスできる

この３つを軸に、Azure 上でどのように扱うかを説明して⾏きます。

{{< figure src="../images/01-cia.png" title="図1x JIS Q 27002(ISO/IEC 27002)" width="400" >}}

## Azure上におけるセキュリティの利点

クラウド(Azure)上におけるセキュリティの利点を理解することは、最も重要な基本知識の一つです。
この利点を活かすことができるかどうかで、プロジェクトの⾏く末は⼤きく変わってきます。

一番根幹となる重要なポイントは[共有責任モデル(Shared responsibility model)](https://docs.microsoft.com/ja-jp/azure/security/fundamentals/infrastructure#shared-responsibility-model)です。

{{< figure src="../images/02-srmodel.png" title="図2 共有責任モデル" width="800" >}}

この図では、オンプレミスとクラウド(IaaS 中心、PaaS 中心)で Microsoft(クラウドプロバイダー)と顧客側の責任がどのように共有されるか。また、利用モデルによって、責任分担がどのように変わるかをまとめています。

例えば、オンプレミス環境では、ユーザーが物理層（データセンター、ハードウェア、ネットワーク）、仮想化レイヤーからアプリケーションまで全てスタックを所有しています。
このモデルでは、すべてのレイヤーの脆弱性を攻撃者の悪⽤から ユーザー が保護する責任があります。ところがクラウドになるとその物理層は、Microsoft の責任部分となり、[PCI DSS に準拠している Microsoft](#mspicdssaoc)に任せる形になります。
続いて、サーバーの OS 自体については、IaaS の管理は、顧客側の責任となり、PaaS の場合は Microsoft の責任部分が増えます。

{{% pageinfo %}}
PCI DSS に準拠している Microsoft は、**PCI DSS 評価(AoC)** へのリンクにしたいが書き方が不明
{{% /pageinfo %}}

原則的には、物理は Microsoft の責任で、アプリケーションは顧客の責任、その間にある OS やミドルウェアは、IaaS だと顧客責任が多くなり、PaaS/SaaS だと顧客責任が少なくなると⾔った構成になっています。
この点からも PaaS/SaaS を活用したほうが、顧客側の責任範囲が小さくなり、アプリケーション自体のセキュリティ対策に集中できるというメリットが非常に大きいといえます。

## 「共有責任モデル」とセキュリティ投資

この「共有責任モデル」で示されるように、小さな開発チームでも PaaS/SaaS を活用すると、Microsoft と責任を適切に分担したセキュアなアプリケーションが作れるようになります。

**ここで強く言いたいのは、セキュリティ投資はビジネスリスクとのバランスで決定される限られたリソースであることです。**
セキュリティに関する様々な要求を自社で全て対応するのは、限られたリソースでは困難です。

そこで、クラウドにアプリケーションをホストすることで、物理やインフラに関わる責任をクラウドプロバイダーに移し、ユーザーはクラウドプロバイダーと責任を分担することができます。
また、クラウドベースのセキュリティ機能を利⽤して脅威の検出と対応にかかる時間を短縮することができ、ユーザーは⾃⼰の責任範囲(主にアプリケーション)にセキュリティ・リソースを集中、もしくは予算を他のビジネス優先事項に割り当てることが可能となります。
このクラウド上における共有責任モデルは、開発速度、品質、運用コストにも大きく貢献します。

時として、クラウドプロバイダーが提供するものとユーザーの要件にはギャップがあります。それを分析しユーザーがコントロール可能な領域、ビジネス要件、アーキテクチャー、実装、運⽤などのレイヤーで適切に対応きるようにすることが、クラウド上におけるアーキテクチャの重要検討事項です。

### シグマコンサルティングの考え

**我々は、限られた顧客のリソースを最⼤限に活かすために、PaaS/SaaS を利⽤し Azure に最適化（＝クラウドネイティブ）した設計を取ること、Azure の進歩に合わせて更新し続けていく事を非常に大切にしています。**

### 次の記事

- [Azure Blueprint: PaaS Web Application for PCI DSS とは](/azure/security/pci-dss-azure-blueprint/)

- [Azure上でセキュアなアプリケーションを作るベストプラクティス](/azure/security/)

## 参考

セキュリティ関連のおすすめリンク（本文未掲載）

- [Azure Security Documentation](https://docs.microsoft.com/en-us/azure/security/)
- [Design for security in Azure](https://docs.microsoft.com/en-us/learn/modules/design-for-security-in-azure/)
