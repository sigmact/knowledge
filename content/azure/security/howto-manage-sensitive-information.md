---
title: "Azure でセンシティブ情報を管理する際の実現方法を比較"
weight: 20
date: 2019-10-22
description: "Microsoft Azureで、アプリケーションで使われるセンシティブ情報(パスワード等)の保護のベストプラクティスについて書いています。以下に、アプリケーションの設定情報を外部に保持する複数の方法について比較し、その後センシティブ情報をKey Vaultに保存する利点を論じています。"
authors: [
    ["Takekazu Omi","images/author/omi.png"]
]
type : "article"
category : "azure"
tags: ["Azure", "セキュリティ"]
eyecatch: "images/eyecatch/keyvault.png"
---

## はじめに

Azure上ではパスワード等のセンシティブ情報を管理する方法がいくつかあります。

本稿では、設定情報を外部に保つ方法として、ローカルファイル(Web.config/appsettins.json)、App Service の[App Settings](https://docs.microsoft.com/en-us/azure/app-service/configure-common#configure-app-settings), [App Configuration](https://docs.microsoft.com/en-us/azure/azure-app-configuration/overview), [Key Vault](https://docs.microsoft.com/en-in/azure/key-vault/key-vault-overview), [Blob Storage](https://docs.microsoft.com/ja-jp/azure/storage/blobs/storage-blobs-overview)の５つを比較しました。後者４つはAzure 固有の機能ですが、同等のものは各種クラウド環境に存在します。

## 比較のポイント

ここでは下記の点を比較のポイントとしました。

- 暗号化の有無：情報が暗号化して保存されるか
- アクセス制御：アプリのデプロイ等の権限と別に認証とアクセス制御に対応しているか
- 監査ログ：read/write/delete/create のログ保存
- 共有：複数のインスタンス、アプリケーションからアクセスの可否
- 変更管理：バージョン管理、もしくはスナップショットのサポート
- 変更通知：変更を通知で受け取れるか

{{< table >}}
|方式|暗号化|ACL|監査ログ|共有|変更管理|変更通知|備考|
|---|----|----|----|----|----|----|----|
|ローカルファイル|✕|✕|✕|✕|✕|✕|※1|
|App Settings|◯|✕|✕|△|✕|△|※2|
|App Configuration|◯|◯|✕|◯|◯|◯|※3|
|Key Vault|◯|◯|◯|◯|◯|✕||
|Blob Storage|◯|△|✕|◯|✕|✕|※4|
{{< /table >}}

- ※1 管理はSCMで実施。App Serviceではaspnet_regiis.exeによる暗号化は利用できず。独自実装が必要
- ※2 共有は、Web Apps/Web Job/Functions等で同一WebSite内のみ。変更した場合はサイトが再起動される
- ※3 ACLはrw/roのアクセスキー、あるいはAADとRBACで制限可能
- ※4 独自実装で作れば全て可能だが、本稿ではBlobの機能のみで扱う

これを見ると、App ConfigurationとKey Vaultの間の差は、監査ログと変更通知だけで、機能面では、大きな差が無いことがわかります。

## 使い分けの基本的な考え方

まず、システムが稼働する業界や企業で定義されているコンプライアンス、ガバナンスに従で定義されている機密情報を確認します。

**その中で、機密情報を扱う場合に、特別なコントロール（NDA、物理セキュリティ等）を要求されている場合は、監査ログが取れる Key Vault 一択になります。**

監査ログが不要で、複数アプリ・インスタンスで共有したいなら、App Conguration、App Settingsという選択肢があります。

環境依存な設定情報には、機密と機密ではないものが両方含まれています。センシティブ情報と定義したデータへのアクセスに必要な設定情報は監査可能なKey Vaultに収容するのがベストプラクティスです。
