---
title: "今更聞けないAzure Web Appsを利用するメリットとは"
weight: 1
date: 2021-03-11
description: "AzureのPaaSサービスであるWeb Appsのメリットをシグマコンサルティング社の運用した実績からご紹介します。"
authors: [
  ["Kazunori Hamamoto","images/author/khamamoto.jpg"],
]
type : "article"
category : "azure"
tags: ["zero to hero", "Azure", "Web Apps"]
eyecatch: "images/eyecatch/zero-to-hero10.jpg"
draft: false
---

## はじめに{#introduction}

この記事は[Azure App Service Team Blog](https://azure.github.io/AppService/)の[Zero to Heroシリーズの記事](https://azure.github.io/AppService/tags/#zero-to-hero)に感銘を受けて、和訳＆改変＆自分で新規執筆した記事です。
この記事を通してWeb Appsの基礎から実運用の方法まで、筆者自身が見直す機会としてシリーズ化して掲載する事にしました。
本家の「Zero to Hero」というフレーズの通り、Azure App Serviceを使ったことの無い方は一人前になれるように、すでに利用している方は知識のアップデートに役立てていただければと思います。

なお、連載の５回目からは筆者オリジナルのコンテンツを掲載しています。目次からまとめて読めますので、是非どうぞ。

[【Azure初心者から上級者まで！】Azure App Service を使いこなしてゼロからヒーローになる](https://www.sigmact.com/updated/zero-to-hero/)

## 概要{#overview}

この記事は [App Service でゼロからヒーロー](https://azure.github.io/AppService/tags/#zero-to-hero) シリーズの第１０回です。

今までの連載でWeb Appsに関する連載を実施してきましたが、Web Appsを紹介する機会がなかったのでこのタイミングで一度ご紹介したいと思います。

弊社では全てのプロジェクトでWeb Appsを利用しておりますが、AzureにはIaaSである仮想マシン(Virtual Machine)を初め、Kubernatesを含めた[コンテナ向けのサービス](https://azure.microsoft.com/ja-jp/product-categories/containers/)もあります。この連載で、弊社がWeb Appsを使い続ける理由と使い方をご紹介できればと思います。

## Azure Web Appsとは{#what-is-webapps}

Azureの公式ドキュメントから引用すると下記のように記載されています。

> Azure App Service を使用すると、インフラストラクチャを管理することなく、任意のプログラミング言語で Web アプリケーション、モバイル バックエンド、および RESTful API を構築し、ホストできます。 Azure Web Apps では、自動スケールと高可用性が実現されるほか、Windows と Linux の両方がサポートされています。さらに、GitHub、Azure DevOps、または任意の Git リポジトリからの自動デプロイが可能になります。 

ここで記載されているAzure App ServiceとはWeb Appsが含まれているAzureでWEBアプリ、API、サーバレス環境をホストするためのサービスの総称です。

Azure App ServiceにはWebアプリやAPIをホストする(Web Apps)、サーバレスアプリケーションをホストする(Functions)、ワークフローをホストする(Logic Apps)が含まれています。公式ドキュメントからの引用にも含まれていますが、以下のような特徴があります。

### Azure App Serviceの特徴{#features}

* インフラを管理する必要がない(PaaSの特徴)
* 任意のプログラミング言語を動作させる事ができる
  * 執筆日時点での対応言語は、.NET、.NET Core、Java、Ruby、Node.js、PHP、Pythonとなっています
* WindowsとLinuxOSをサポートしている
* 自動的なスケールアップとスケールアウトによる高可用性
* 標準で自動デプロイに対応している(GitHub、Azure DevOps、Gitリポジトリ)

詳細は[Azure App Serviceの公式ドキュメント](https://docs.microsoft.com/ja-jp/azure/app-service/)をご覧いただければ、どのような機能があるかは俯瞰する事ができるので、一度ご覧ください。

## Web Appsを使用するメリットと最適に運用する方法{#webapps-is-good}

### インフラを管理する必要がない{#no-need-to-manage-infrastructure}

一番の理由といっても過言ではないのですが、インフラを管理する必要がありません。通常Webアプリケーションを構築する場合には、ホストするサーバーを調達し、その上でアプリケーションを動作させるため、サーバーのメンテナンスも必須となります。OSのアップデートを初め、各種セキュリティ対策や監視など**アプリケーション以外でも多くの事を考慮する必要がありますし、知識も要求されます。**

Web Appsでホストしている場合はOSやサーバー本体に関する部分はAzureにて自動的に管理されるため、**利用者は多くの時間をアプリケーションに注力する事が可能となります。**

### Web Appsを利用するうえで制限について{#restrictions}

Web Appsは仮想マシンと比べると制限は存在します。OSレイヤには触れることが難しいため、要件次第では利用できない場合もありますが、Web Appsにも様々なアップデートが行われ大体の要件はクリアできるようになっています。

一例をあげると、IPアドレスによる制限や特定のVNETに含める事はWeb Appsをでも実施できるようになっています。

弊社でもWeb Appsを利用したPCI DSS（Payment Card Industry Data Security Standard）を実施した事例もありますので、ご興味がある方は[こちら](https://www.sigmact.com/article/2020/azure-pcidss-komeri/)の事例ページをご覧ください。

### コンテナは使わないの？{#donot-you-use-containers}

Azure上ではコンテナを扱う方法は[Azure Container Instances](https://azure.microsoft.com/ja-jp/services/container-instances/)を初め、幾つかのサービスが用意されていますが、Web AppsでもDockerコンテナをホストする機能は存在します。しかし、弊社でコンテナを利用しているケースは今のところ存在しません。

理由は幾つか考えられますが、コンテナ化する際にはコンテナイメージを作成する必要があります。様々なイメージは公式・非公式問わずに存在しますが、利用する際はどのようなイメージ構成になっているか理解する方が好ましいです。

深く理解しない状態でも利用する事はできると思いますが、継続して運用していると何かしらのトラブルは付き物です。トラブルシューティングを行う際にコンテナインスタンスでの問題なのか、アプリケーションの問題なのか切り分ける必要は出てくるのでコンテナイメージの理解は必須かと思います。

コンテナを利用していない理由は、**コンテナイメージのメンテナンスを避けたい**ためです。Web Appsを利用していると**アプリケーションを動作させるためのサーバーは常に最新の状態が適用されるためアプリケーションにのみ注力**しています。

### 高可用性について{#hign-availability}

Web Appsの機能にオートスケールアップとオートスケールアウトの機能が存在します。指定した条件でインスタンスの数やサイズを増減させて可用性を維持する機能です。

弊社が運用している事例ではオートスケールを利用したケースはほとんどありません。利用しているインスタンスはお客様の予算等にもよりますが、S1やP1インスタンスを1台～2台で運用しているケースが多いです。（インスタンスサイズと金額に関する資料は[こちら](https://azure.microsoft.com/ja-jp/pricing/details/app-service/windows/)をご覧ください）

これには弊社が担当している事業が大きな理由になっているかと思います。弊社では多くのECサイトの構築＆運用をするケースが多いのですが、**ECでは突発的なオートスケールが必要となるケースがほとんどありません。**

広告やセールなどにより、通常よりもリクエストが多くなるケースはありますが、広告やセールなどは**事前に予測できるためインスタンスを調整しておくことが容易**だからです。施作を実施する前にインスタンスサイズを上げ、終わった場合は下げる運用を行っています。

このような事ができるのは.NET CoreとWeb Appsのよる組み合わせのパフォーマンスが良い事と、キャッシュを利用してWeb Appsまでリクエストが到達しないようなアプリケーションになっていることも大きな要因になっています。

### スケールしたい処理は？{#the-process-you-want-to-scale-is}

事前に予測しにくい、かつスケールが求められるのは弊社の利用ケースですとバッチ系の処理が該当する事が多いです。

例えばECサイトの運用者が新しい商品を追加する際や、在庫の調整等を行う時など様々なケースで発生する事が考えられますが、そのようなケースでは[Azure Functions](https://azure.microsoft.com/ja-jp/services/functions/)を利用しています。

今回はAzure Funcitonsに関しての詳細は省きますが、Azure App Service内に含まれるサーバーレスを実現するサービスです。従量課金プランやPremiumプランを利用すると最大で200インスタンス(Premiumは100)までスケールする事ができます。Azure Functionのスケールに関する情報は[こちら](https://docs.microsoft.com/ja-jp/azure/azure-functions/functions-scale)をご覧ください

このように、Web Appsで得意な処理とFunctionで得意な処理を分離していることが重要です。

### マネージドサービスを徹底的に利用する{#user-managed-service}

Web AppsとFunctionの組み合わせの例を出しましたが、他にもフルマネージドのサービスは多く存在します。**フルマネージドのサービスを組み合わせる事で、アプリケーション以外のメンテナンスコストを大きく下げる事ができます。** 代表的な例は以下の通りです

* ストレージ : Azure Storage Blob
* キューイング : Azure Storage Queue
* リレーショナルデータベース : SQL Database
* キャッシュ : Azure Cache for Redis
* NoSQL : Azure Cosmos DB

サービスの組み合わせや手法に関してはMicrosoftがまとめている[Azureアーキテクチャセンター](https://docs.microsoft.com/ja-jp/azure/architecture/)のページを参考にすると良いでしょう。

## まとめ{#summary}

今回は弊社のWeb Appsの使い方と使用する理由について紹介しました。Web Appsを利用して**アプリケーションの開発に注力でき、お客様の事業成功を導く**事をモットーにしていると筆者自身思っています。

あくまでも社内やチームの人数やスキルセットのバランスなどにより、私達のようにならないケースは多いと思います。また、行っている事業によってはWeb Appsでは都合が悪い部分は出てくるかもしれません。自分たちの実施したい事と得意分野を見極めて、利用するクラウドサービスを選定する事が重要だと思います。
