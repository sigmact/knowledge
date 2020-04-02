---
title: "自社にとって最適なデプロイを突き詰める"
authors:
  [
    ["Hiroyuki Kinoshita", "images/author/kinoshita.png"],
    ["Tsubasa Yoshino", "images/author/yoshinotsubasa.jpg"],
  ]
weight: 10
date: 2999-04-01
description: "弊社では少数精鋭によるパブリッククラウドを利用した SI の提供を前提とした DevOps に取り組んでいます。取り組みの中では弊社にとってベストプラクティスに到達している要素もあれば、継続的に検証と改善を繰り返している要素もあり、まだまだ未成熟な状態です。"
type: "article"
draft: true
eyecatch: "images/eyecatch/deploy.png"
---

## はじめに

本稿では弊社で取り組んでいる DevOps について記載します。DevOps 自体には厳密に明確な定義はありませんので、DevOps の手法については取り組んでいる組織や環境によって様々だと思います。弊社では少数精鋭によるパブリッククラウドを利用した SI の提供を前提とした DevOps に取り組んでいます。取り組みの中では弊社にとってベストプラクティスに到達している要素もあれば、継続的に検証と改善を繰り返している要素もあり、まだまだ未成熟な状態です。数年間実務で取り組んできた弊社の DevOps はどういった観点でどのような取り組みを実施しているのか、整理も含めて本稿でまとめていきます。

## 業務上の背景

弊社ではパブリッククラウド、特に Microsof Azure を中心に SI を展開しています。業務内容の詳細は後述しますが、主幹として EC 業務を中心に様々な SI に従事しています。基本的にビジネス速度が早く業務改善や新規施策等の PDCA サイクルを短期的に回すことの多い業務を得意としています。

弊社は少数精鋭でプロジェクトを進めることが多いので開発者と運用者を組織的に分けるということはしていません。開発者=運用者と捉えることもできると思います。少数精鋭で組織や役割の区分けもなく開発効率や運用効率が求められるとなれば必然的に DevOps を導入することになります。ここで先にも述べた通り開発者と運用者の区別がないのが弊社の特徴になります。その他の特徴としてリモートワーク推奨、サテライトオフィスの設置を行っているためプロジェクトメンバーが点在している環境で開発や運用をすすめているのも大きな特徴です。

弊社の特徴をふまえると世間一般でいわれている DevOps の組織的なメリットにはあてはまりません。マーケティング、営業、開発、運用のように組織が分かれている場合はそれぞれの組織に対する不満や KPI 等に振り回されることが多いと思いますが少数である弊社では社員同士のつながりで解決できることが多いです。
なぜかというと DevOps の本質であるメンタル要素を社内でチームビルディングしながら素養として社員ごとに培っているからです。そうすることで社員同士のつながりで相乗効果を上げながら問題を解決することができ組織文化の発展にもつながります。どうやって培っているかについては特殊すぎるのでここでは言及しませんが、弊社の CEO の Tiwtter をフォローしてもらえればわかることが多いと思います。

- Respect : 相手のことを思いやる
- Trust : メンバーを信頼する
- Healthy attitude about failure : 失敗は起きるものとしてとらえる
- Avoiding Blame : ミスが起きたとしても担当者を責めない

弊社は下記にあげる生産や効率に特化した DevOps の基本性質を業務に取り込んでいます。フィードバックループを高速化することに主軸をおきつつ回復性とリスク分散による心理的安全性を担保するための取り組みを行っています。

- リリースの高速化
- 生産性の向上
- リスクの分散
- 円滑な情報共有

これらを踏まえて**「冪等性」**による担保を加えるようにしています。
冪等性とは「同じ操作を何度繰り返しても、同じ結果が得られる性質」です。
冪等性を担保することで誰が操作しても同じ結果を常に得られるように環境を構築しておけばリスク回避につながります。
例えば In-Place Deployment によるプログラムリソースの上書きデプロイを本番環境に行うとした時、作業者の心理的負担と障害が発生した時のリスクは計り知れないものとなります。容易にロールバックできる環境を用意し切り戻しができる安心感と障害時間の最小化に務めるべきでしょう。この操作を誰が行っても問題が起きないように担保するために弊社では Azure DevOps を採用しています。

Devops には正解がないのでそれぞれの組織、プロジェクト、チームにとって常に最適解を探模索する必要があります。
最適解の模索を DevOps を育成すると表現している方もいらっしゃいますがまさにその通りだと思います。
本稿で弊社が育んできた DevOps の組織的文化を紹介できればと思います。

### 開発と運用と DevOps

<!--
Keyword
運用でポカしない＝心理的安全性
運用でポカすると無駄な作業が増える＝効率化
誰がやっても＝べきとうせい
承認制＝責任の冗長化
自動テスト
-->

弊社の社員は複数の運用案件に従事しながら１つの開発案件に従事しているケースが多いです。
これは弊社だけではなく世間の SIer に多い座組だと思います。
ただ、弊社の場合はそういった座組を少数精鋭で回していく必要があるため、より生産性の向上と効率化が求められます。
ここでは開発と運用が錯綜する状況下でどのように DevOps に取り組んでいるかについて説明します。

Project Manager として従事する筆者の視点でいうと DevOps は RPG ゲームでいうところの補助魔法だと思います。少数精鋭で開発を進めるためには開発者の開発効率を最大限引き上げる必要があります。そのためにはインフラ構築やマニュアルデプロイ等の省ける作業は極力省いていかなくてはなりません。
開発効率をあげて生産性の向上をはかる　 → 　 FB ループのサイクルを上げることで効率よく品質を高めていく

![開発時](../images/images02.png)

運用面での効果

運用作業でミスを減らす　 → 　運用作業をミスると無駄な作業が増えるため極力減らす　＋　ミスを減らせばお客の心象もよくなる
誰が操作しても同じ結果を得られるようにする　 → 　心理的安全性を持つ　 → 　ここには課題がある
責任の分散化を行う（承認制を導入して確認者を増やしてリスクを減らす）

![運用時](../images/images02.png)

### なぜ Azure DevOps を選んだのかシステム的な理由

数ある DevOps ツールの中で弊社では Azure DevOps を選択し利用しています。もともと Azure をベースとした SI やサービス展開を行っているため、Azure との親和性の高さやとっつきやすさから利用を開始ししました。

## Azure DevOps
### はじめに
DevOps は、ツールでは、ありません。

DevOps とは、顧客へ継続的に価値を提供するために人、プロセス、プロダクトといったものをまとめ上げる事を指します。
いわば一種の思考方法と捉えることが出来ます。

Azure DevOps は、その思考を助けるための補助ツールとしての役割でしかありません。
そのため、Azure DevOps を使用している = DevOps が出来ている、DevOps をしているというような考えは、完全な誤りです。
その点を頭の片隅に置いておくことが重要です。

### 本章について
本章は、主に Azure DevOps の一つの機能である Azure Pipelines について解説を行います。

本章に置ける主たる目的は、Azure Pipelines を用いた CICD パイプラインの構築を学習することと定めます。

はじめに C#、ASP.NET Core を用いてアプリケーションの自動ビルドの方法について解説します。

その次に、アプリケーションを Azure Web App へリリースする方法について解説を行います。

最後に、承認フローなど実際にシステム開発、運用で用いそうな周辺機能についての解説を行います。

### 用語解説
本題の前にこの後に登場する用語、関連する用語の解説を行います。
#### Continuous Integration (CI)
CI は、開発者がコードを中央のリポジトリにマージし、その後に自動ビルド、自動テストを行うという手法です。
日本語では、継続的インテグレーションを訳されます。

この手法の主たる目的は、継続的なビルド、テストによりソースコードに潜むバグを早期に発見、対処することです。
#### Continuous Delivery (CD)
Continuous Delivery は、CI を拡張し、ビルド、テストしたソースコードを検証環境や本番環境にデプロイする流れまでを組み込んだ手法です。
日本語では、継続的デリバリーと訳されます。

この手法では、テスト完了後にソフトウェアをリリースする直前の状態の状態まで持っていき、あとは、ボタン一つでリリースが完了するという状態までを自動化します。

#### Continuous Deployment (CD)
Continuous Deployment は、Continuous Delivery をより拡張した手法であり、本番リリースまでをすべて自動化する手法です。
日本語では、継続的デプロイ、継続的デプロイメントと訳されます。

この手法では、リポジトリにマージされたコードが常に本番環境で動く事を目的とするため、より細かい粒度でのソースの変更、網羅性の高い幅広い自動テストを用意する必要があります。

### パイプラインを構築する
ここから、Azure Pipelines を用いたパイプラインの構築方法について説明していきます。

Azure DevOps は、当初ビルドとリリースがそれぞれビルドパイプライン、リリースパイプラインと機能的に分離されていました。
ですが現在は、一つのパイプラインで全てを賄う Multi Stage Pipelines という機能が登場し、それらが一つに統合される流れがあります。
そのため本章でも Multi Stage Pipelines を用いて解説を行います。
※ Multi Stage Pipelines は、現在プレビュー中の機能です。

また各パイプラインの構築は、主に YAML を記述することによって構築を行います。
一部の例外を除いて全て YAML が用いられます。
YAML で記述するメリットとしては、定義のテンプレート化による再利用性の向上、バージョン管理などが挙げられます。

### 注意点
YAML を使用したパイプラインの構築は、
* Azure Repos
* Bitbucket Cloud
* GitHub
* GitHub Enterprise Server

をリポジトリとして使用している場合にのみ使用することが可能です。

### ビルドするアプリケーション
今回は、以下のアプリケーションをビルドします。

* 言語 : C#
* アプリケーションの種類 : ASP.NET Core
* ランタイムバージョン : .NET Core 3.1

### アプリケーションをビルドする
はじめにアプリケーションのビルド設定です。

以下の yaml 定義がビルド用の一番シンプルな定義です。
最初の task:DotNetCoreCLI@2 は、アプリケーションのビルドを行います。
次の task:DotNetCoreCLI@2 は、ビルドして出来た成果物を zip にしてアップロードできる形に変換します。
最後の publish は、先ほど生成した成果物を Pipeline Artifact にアップロードします。
今回は、webApp という名前で成果物をアップロードしています。

```yaml
# 全てのブランチでコミットされたら実行する
trigger:
  branches:
    include:
      - '*'

variables:
  buildConfiguration: 'Release' # ビルド設定 e.g.) Release, Debug
  project: '**/*.csproj' # ターゲットプロジェクト名
  vmImage: 'windows-latest'  # ビルドに使用するマシンのイメージ e.g) windows-latest, ubuntu-latest

# アプリケーションをビルドする
stages: 
- stage: Build
  jobs:
  - job: Build
    pool:
      vmImage: $(vmImage)
    steps:
    - task: DotNetCoreCLI@2
      inputs:
        command: 'build'
        projects: $(project)
    - task: DotNetCoreCLI@2
      displayName: 'Publish'
      inputs:
        command: 'publish'
        publishWebProjects: true
        projects: $(project)
        arguments: '--configuration $(buildConfiguration) --output $(System.DefaultWorkingDirectory)/publish'
        zipAfterPublish: true
    - publish: 
      displayName: 'Publish artifact'
      artifact: webApp
```

それぞれの項目を説明します。

```yml
jobs:
- job: Build
  pool:
    vmImage: $(vmImage)
  steps:
  - task: DotNetCoreCLI@2
    inputs:
      command: 'build'
      projects: $(project)
  - task: DotNetCoreCLI@2
    displayName: 'Publish'
    inputs:
      command: 'publish'
      publishWebProjects: true
      projects: $(project)
      arguments: '--configuration $(buildConfiguration) --output $(System.DefaultWorkingDirectory)/publish'
      zipAfterPublish: true
  - publish: 
    displayName: 'Publish artifact'
    artifact: webApp
```

各パイプラインは、少なくとも一つの jobs を含みます。
jobs の中には、複数の job が含まれ、それが逐次実行されていきます。
job の中には、 steps があり、その中には一つ以上の処理が含まれます。
steps 内の処理もそれぞれ上から逐次処理されます。

この例では、task: DotNetCoreCLI@2 → task:DotNetCoreCLI@2 → publish の順に逐次実行されます。

```yml
stages: 
- stage: Build
```

stages は、Multi Stage Pipelines を構築する際に必要になります。
stages の中には、少なくとも一つの stage が含まれます。
また stage の中には、少なくとも一つの jobs が含まれます。

### アプリケーションをリリースする
次にアプリケーションのリリース設定です。
今回は、Azure Web App にリリースする方法を説明します。
先ほどのテンプレートにリリース用の設定を追加します。
リリースまで記述したテンプレートは、以下のようになります。

```yml
trigger:
  branches:
    include:
      - '*'

variables:
  buildConfiguration: 'Release'
  project: '**/*.csproj'
  vmImage: 'windows-latest'
  environment: 'Production'
  azureSubscription: ''
  appName: ''
  artifactName: '*.zip'

stages:
- stage: Build
  jobs:
  - job: Build
    pool:
      vmImage: $(vmImage)
    steps:
    - task: DotNetCoreCLI@2
      inputs:
        command: 'build'
        projects: $(project)
    - task: DotNetCoreCLI@2
      displayName: 'Publish'
      inputs:
        command: 'publish'
        publishWebProjects: true
        projects: $(project)
        arguments: '--configuration $(buildConfiguration) --output $(System.DefaultWorkingDirectory)/publish'
        zipAfterPublish: true
    - publish: 
      displayName: 'Publish artifact'
      artifact: webApp

# リリース設定
- stage: Release
  dependsOn:
  - Build
  condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/master'))
  jobs:
  - deployment: WebApp
    displayName: 'Release'
    pool:
      vmImage: $(vmImage)
    environment: $(environment)
    strategy:
      runOnce:
        deploy:
          steps:
          - task: AzureWebApp@1
            displayName: 'Deploy to Azure Web App'
            inputs:
              azureSubscription: $(azureSubscription)
              appName: $(appName)
              package: '$(Pipeline.Workspace)/**/$(artifactName)'
```

stages の下に、新たに stage の項目を追加しました。
またそれぞれの項目を見ていきます。

``` YAML
  dependsOn:
  - Build
  condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/master'))
```

dependsOn は、指定したステージが完了したら実行するといった条件を記述するために使用します。。
細かい動作は、condition に指定します。
今回は、Build ステージが成功状態で完了し、且つトリガーされたブランチが master の場合に実行するという設定になっています。

``` YAML
environment: $(environment)
```

environment は、Azure Pipelines の Environments(後述) で作成したリソースを指定します。
Environments は、デプロイ履歴や承認などリリース関連の情報を管理するための機能です。
指定した Environment が存在しない場合は、自動で生成されます。

``` YAML
strategy:
  runOnce:
    deploy:
```

strategy は、デプロイ方法を指定する項目です。
* runOnce
* rolling
* canary

の 3パターンを定義できます。

runOnce は、シンプルなデプロイ処理です。
デプロイ前処理、デプロイ、デプロイ後処理、成功・失敗後処理などがそれぞれ一度実行される方法です。
Web App を使う場合は、基本的にこれを指定します。

rolling は、複数のインスタンスに順次デプロイするために使用します。
並列に複数のインスタンスにデプロイし、問題があった場合は、切り戻しを行うといった仕組みが構築できます。
現在は、仮想マシンのみサポートしています。

canary は、カナリアリリース用の設定です。
最初に 10% のインスタンスにリリース、次に 20% にリリース、それが成功したら全てに展開といった方法を取ることが出来ます。

``` YAML
steps:
- task: AzureWebApp@1
  displayName: 'Deploy to Azure Web App'
  inputs:
    azureSubscription: $(azureSubscription)
    appName: $(appName)
    package: '$(Pipeline.Workspace)/**/$(artifactName)'
```

deploy には、steps が含まれます。
steps は、先述の通りです。
ここでは、Azure Web App にデプロイするためのタスクを設定しています。
このタスクは、サブスクリプションId、アプリケーション名、デプロイするパッケージ(先ほど作成したzip)を指定するとデプロイが実行されます。
これにより zip デプロイが実行されます。


### パイプラインに承認フローを取り入れる
先ほどのリリース処理は、ビルドが成功するとそのまま Web App にデプロイされます。
リリース時には、リリース承認を設定することが出来ます。
リリース承認は、先述の Environments 機能を使用します。

Web App 用の Environment は、以下の画像のように Resource を None に設定して作成するか、Environment に適当な値を指定してリリース処理を実行すると作成されます。
{{< figure src="../images/environment01.gif" title="Environment 作成" width="300" >}}

Environment 作成後、画面右上のメニューから Approvals and checks を選択します。
Approvals and checks の画面では、承認者を誰にするかを設定することが出来ます。
この際、承認者を複数にする事も可能です。

{{< figure src="../images/environment02.gif" title="承認設定" width="300" >}}

承認は、Pipelines の画面や、Slack などのツールから実行できます。
承認待ち状態になると、Pipeline 画面には、Review ボタンが表示されます。
承認メニューでは、Approve と Reject のボタンがあるので、適宜コメントを付けて処理しましょう
{{< figure src="../images/environment03.gif" title="承認待ち状態の Pipeline 画面" width="300" >}}

### 最後に
本章では、ASP.NET Core MVC のアプリケーションをビルド、Azure Web App へリリースする一連の流れを YAML で構築する方法を説明しました。
今回は、ミニマムな構成にしたため扱っていない処理がいくつかあります。
そのため実際に業務で使用する際は、一例として以下のような処理を追加することをお勧めします。

* ビルド時のユニットテストの実行
* 本番環境リリース時にステージングスロットへのデプロイ
* 承認完了後にステージングスロットから本番環境へのスワップ
* デプロイなどの失敗時における処理の追加

CI/CD を構築することによって、チームが得られるメリットは、計り知れないものがあります。
ですが、CI/CD の構築は、DevOps を実行するうえでの第一歩に過ぎないということを常に頭の片隅に入れておくことが重要です。

### 参考

Azure DevOps の詳細なドキュメントは、以下にまとまっています。

- [Azure DevOps Documentation](https://docs.microsoft.com/en-us/azure/devops/?view=azure-devops)


<!-- #### ステージングスロットを活用する
先ほどは、承認されたら本番にデプロイされるという流れでしたが、その場合本番環境にて、アプリケーションの再起動が実行されるためアプリケーションが起動するまでの間にダウンタイムが発生します。
そこでステージングスロットを活用し、ステージングスロットにデプロイ → 承認されたらスワップして本番に展開
という流れを設定する方法を説明します。

#### より再利用性の高い YAML を書く
いままで一つの YAML ファイルで記述してきましたが、この場合似たような設定を何度も書いたりと再利用性が高くありません。
そこで再利用性向上のために、一部の記述をまとめて外部ファイル化し、ファイル呼び出しにより処理を追加する方法を説明します。

#### YAML のテストをローカルから実行する
YAML を書いてパイプラインを作る場合、毎回コミット → テスト を行うとトライ&エラーで不要なコミット履歴が積み重なったりといったことが発生します。
Azure Pipelines には、それを見越して REST API 経由で YAML のテストを行う機能が備わっています。
ここでは、その API の使用方法について説明します。 -->

