---
title: "Azure におけるセキュリティ"
date: 2020-11-27T11:02:05+06:00
icon: "ti-panel"
description: "サンプルページ、サブセクションテスト用"
type : "category_top"
eyecatch: "images/eyecatch/pcidss.png"
draft: false
---

## ベストプラクティスを突き詰め続ける

本稿では、Azure 上でアプリケーションを構築する開発者向け(元々は社内向け)に、セキュア・アプリケーションを構築する際のベストプラクティス的な内容をアップデートし続けていく事を目指しています。

**特にこだわっていることとしては、PaaS、サーバーレスを使いこなし、元来人力で行う必要があったセキュリティ対策をより安全なクラウド側で実施していく事です。**
**セキュリティ対策の大半はクラウド側に任せて、アプリケーション内における対応に集中し、不完全な人力作業を排除し、開発に集中したいのです。**

## PCI DSS を例に紹介

セキュリティの基準については、PCI DSS 準拠が求められるクレジットカードイシュアのカード会員システムを [Microsoft Azure](https://azure.microsoft.com/en-us/) 上で [PaaS](https://azure.microsoft.com/ja-jp/overview/what-is-paas/) を中心に作った際の事例を基にしています。

なお、[事例ページはこちらから閲覧できます。](https://www.sigmact.com/article/2020/azure-pcidss-komeri/)

[PCI DSS](https://www.pcisecuritystandards.org/)は運用要件も大きく含むので、ここではテクノロジーカットにフォーカスして、PCI DSS 要件をユースケースとして紹介していきます。

アプリケーションを構築する業界、システムの種別によっては、PCI DSS 要件ほど厳密に対応しないケースもあると思います。
業界の要求度合いによっては、このベストプラクティスが全てではないので、持ちうるリソースを考慮して、最適な実現方法を選択するようにしましょう。
