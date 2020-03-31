---
title: "自社にとって最適なデプロイを突き詰める"
authors: [
    ["Hiroyuki Kinoshita","images/author/kinoshita.png"],
    ["Tsubasa Yoshino","images/author/yoshinotsubasa.jpg"]
]
weight: 10
date: 2020-04-10
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

### 事業内容

- 別途記載(2019 年の蛎殻町)

### 開発や運用周りで起きる困りごととは何か

読者の方は開発を行っているときに運用のことまで考えて実装をしていますでしょうか？運用のことまで考えて実装をしていると胸を張って言える方は DevOps の素養が抜群にあると思いますので本章は読み飛ばしてください。運用は他の人や部署がやるのでそこまで考えていないという方はすこしお付き合いいただければと思います。

<!--
- 手動デプロイだと Visual Studio からステージング環境に本番設定でデプロイできてしまう等、トラブルを稀に起こす。
- 現環境が、誰がいつデプロイしたのか良くわからないことがある。今起きている事象とデプロイとの相関性が把握しにくい。
- ステージングで動作確認しても、久しぶりの本番デプロイが怖い。
- トラブルに伴い、一度すぐロールバックできるようにして、リリース時のトラブル軽減に加えて心理的な安全を確保したい。
- -->

### なぜ Azure DevOps を選んだのかシステム的な理由

数ある CI/CD ツールの中で弊社では Azure DevOps を選択し利用しています。
もともと Azure をベースとした SI やサービス展開を行っているため、Azure との親和性の高さやとっつきやすさから利用を開始しました。

<!--
- 楽だから。ポチポチしてパイプラインを作ると出来上がる。
- Azure と親和性が高い。
- .NETCore を使うとほぼ間違いがない。
- VS からアップロードしない世界になる。
- 任意のバージョンに戻せるようにして、心理的な安全を確保。
- 情報を公開して、楽になりたい人が使っていく、後の人も楽だから。
- 途中から実装手伝いで入っても、デプロイは意識せずに済む。
- -->

### 運用を含めたメリット

<!-- - 客がデプロイのフローに参加できる。
- デプロイ承認を顧客が実施することにより、相手に検収という行為をしてほしい。
- 適切に改修した責任をシェアしたい。※改修内容をちゃんと確認しない顧客もいる。 -->

### デプロイと運用監視の専任を立てるべきか

<!-- - PaaS やサーバーレス中心の中、デプロイやインフラ専門職を用意したいか？
- その人に全部片づけてほしいか？例えば、その人にいくら給与を払いたいか。
- 任せられるなら任せたい。コードに集中したい。 という意見もあったが、
- プロジェクトの機能を実装しながら、ログの管理、構成管理、セキュリティ管理、今は自分達でも短い時間で出来る量。ただプロジェクトの佳境で並行して設定するのは大変。 -->

インフラは専任にお任せというのは一昔前の話で、非機能要件もコントロールできてこそ、強いクラウドネイティブエンジニアでは？
という意見もあり、楽はしたいものの、専任を立てず自分でコントロールする方が望んでいる人が多く、現状は、経済的効果でデプロイと運用監視の選任は立てないこととなった。(専任が必要になるラインは近いかもしれないとは考えておく。)

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

その次に、アプリケーションを Azure Web App、Function App へリリースする方法について解説を行います。

最後に、承認フローなど実際にシステム開発、運用で用いるような周辺機能についての解説を行います。

### 用語解説
本題の前にこの後に登場する用語、関連する用語の解説を行います。
#### Continuous Integration (CI)
CI は、開発者がコードを中央のリポジトリにマージし、その後に自動ビルド、自動テストを行うという手法です。
日本語では、継続的インテグレーションを訳されます。

この手法の主たる目的は、継続的なビルド、テストによりソースコードに潜むバグを早期に発見、対処することです。
#### Continuous Delivery (CD)
Continuous Delivery は、CI を拡張し、ビルド、テストしたソースコードを検証環境や本番環境にデプロイする流れまでを組み込んだ手法です。
日本語では、継続的デリバリーと訳されます。

この手法では、テスト完了後にソフトウェアをリリースする直前の状態の状態まで持っていき、あとは、ボタン一つでリリースが完了するという状態までを自動化します。。

#### Continuous Deployment (CD)
Continuous Deployment は、Continuous Delivery をより拡張した手法であり、本番リリースまでをすべて自動化する手法です。
日本語では、継続的デプロイ、継続的デプロイメントと訳されます。

この手法では、リポジトリにマージされたコードが常に本番環境で動く事を目的とするため、より細かい粒度でのソースの変更、網羅性の高い幅広い自動テストを用意する必要があります。

### パイプラインを構築する
ここから、Azure Pipelines を用いたパイプラインの構築方法を記述していきます。

Azure DevOps は、当初ビルドとリリースがそれぞれビルドパイプライン、リリースパイプラインと機能的に分離されていました。
ですが現在は、一つのパイプラインで全てを賄う Multi Stage Pipelines という機能が登場し、一つに統合される流れがあります。
そのため本章でも Multi Stage Pipelines を用いて解説を行います。

また各パイプラインの構築は、主に YAML による記述によって構築を行います。
一部の例外(Azure Reposや、GitHub、Bitbukect Cloud を除く外部の Gitリポジトリ、Subversionなど) を除いて全て YAML が用いられます。。
YAML で記述するメリットとしては、定義のテンプレート化や、再利用性の向上、バージョン管理などが挙げられます。

### 注意点
YAML を使用したパイプラインの構築は、
* Azure Rep
* GitHub
* GitHub enterprise

#### アプリケーションをビルドする
はじめにアプリケーションのビルド設定です。
今回は、以下のアプリケーションをビルドします。

* 言語 : C#
* アプリケーションの種類 : ASP.NET Core
* ランタイムバージョン : .NET Core 3.1

以下の yaml 定義がアプリケーションビルド用の一番シンプルな定義です。
steps の一段下にある項目がそれぞれビルド時に実行される処理の一塊です。
最初の task:DotNetCoreCLI@2 は、アプリケーションのビルドを行います。
次の task:DotNetCoreCLI@2 は、ビルドして出来た成果物を zip にしてアップロードできる形に変換します。
最後の publish は、先ほど生成した成果物を Pipeline Artifact にアップロードします
今回は、webApp という名前で成果物をアップロードします

```YAML
trigger:
  branches:
    include:
      - '*'

variables:
  # ビルド設定
  # e.g.) Release, Debug
  buildConfiguration: 'Release'
  # ターゲットプロジェクト名
  project: '**/*.csproj'
  # ビルドに使用するマシンのイメージ
  # e.g) windows-latest, ubuntu-latest
  vmImage: 'windows-latest'
  
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

#### アプリケーションをリリースする
次にアプリケーションのリリース設定です。
今回は、Azure Web App にリリースする方法を説明します。
先ほどのテンプレートにリリース用の設定を追加します。
リリースまで記述したテンプレートは、以下のようになります。

``` YAML
# ASP.NET Core
# Build and test ASP.NET Core projects targeting .NET Core.
# Add steps that run tests, create a NuGet package, deploy, and more:
# https://docs.microsoft.com/azure/devops/pipelines/languages/dotnet-core

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

- stage: Release
  dependsOn:
  - Build
  condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/master'))
  jobs:
  - deployment: WebApp
    displayName: 'Release'
    pool:
      vmImage: $(vmImage)
    environment: $(production)
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
ビルド時よりも少し複雑な構成になっているのでそれぞれの項目を見ていきます。

``` YAML
  dependsOn:
  - Build
  condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/master'))
```

dependsOn は、テンプレート内の stage を指定して設定する項目です。
この項目に指定された stage が終了したら実行するといった形を設定できます。
細かい動作は、condition に指定します。
今回は、Build の stage が成功状態で完了し、且つトリガーされたブランチが master の場合に実行するという設定になっています。

``` YAML
environment: $(production)
```

environment は、Azure Pipelines の Environments で作成したリソースを指定します。(後述)
Environments は、デプロイ履歴や承認などリリースを管理するための機能です。
environment は、指定しない場合、自動で作成され Environments に追加されます。

``` YAML
strategy:
  runOnce:
```

strategy は、ロールアウト方法を指定する項目です。
* runOnce
* rolling
* canary

の 3パターンを定義できます。

runOnce は、シンプルなデプロイ処理です。
デプロイ前処理、デプロイ、デプロイ後処理、成功・失敗後処理がそれぞれ一度実行される方法です。
Web App を使う場合は、基本的にこれを指定します。

rolling は、複数のインスタンスに順次デプロイするために使用します。
並列に複数のインスタンスにデプロイし、問題があった場合は、切り戻しを行うといった仕組みが構築できます。
現在は、仮想マシンのみサポートしています。

canary は、カナリアリリース用の設定です。
最初に 10% のインスタンスにリリース、次に 20% にリリース、それが成功したら全てに展開といった方法を取ることが出来ます。
主に k8s を使う場合に使用します。

``` YAML
deploy:
  steps:
  - task: AzureWebApp@1
    displayName: 'Deploy to Azure Web App'
    inputs:
      azureSubscription: $(azureSubscription)
      appName: $(appName)
      package: '$(Pipeline.Workspace)/**/$(artifactName)'
```

deploy 以降が、デプロイ用の実際のタスクになります。
ここでは、Azure Web App にデプロイするためのシンプルなタスクを使用します。
このタスクは、サブスクリプションId、アプリケーション名、デプロイするパッケージ(先ほど作成したzip)を指定するとデプロイが実行されます。
これにより zip デプロイが実行されます。


#### パイプラインに承認フローを取り入れる
先ほどのリリース処理は、ビルドが成功するとそのまま Web App にデプロイされます。
リリース時には、リリース承認を設定することが出来ます。
リリース承認は、先述の Environments 機能を使用します。

Web App 用の Environment は、以下の画像のように Resource を None に設定して作成するか、Environment を指定せずに Pipeline でリリース処理を実行すると作成されます。
{{< figure src="../images/Environment-01.png" title="Environment 作成例" width="300" >}}

Environment 作成後、画面右上のメニューから Approvals and checks を選択します。
{{< figure src="../images/Environment-02.png" title="Approval トップ" width="300" >}}

Approvals and checks 画面中央の Approvals を選択すると誰に承認刺せるかを選択するメニューが開きます。
{{< figure src="../images/Environment-03.png" title="承認設定メニュー" width="300" >}}

設定画面の Add users and groups へ、承認するユーザを指定すると、リリース時に指定したユーザに承認依頼が送られます。

承認は、Pipelines の画面や、Slack などのツールから実行できます。
承認待ち状態になると、Pipeline 画面には、Review ボタンが表示されます。
{{< figure src="../images/Environment-04.png" title="承認待ち状態の Pipeline 画面" width="300" >}}

承認メニューでは、Approve と Reject のボタンがあるので、適宜コメントを付けて処理しましょう

#### ステージングスロットを活用する
先ほどは、承認されたら本番にデプロイされるという流れでしたが、その場合本番環境にて、アプリケーションの再起動が実行されるためアプリケーションが起動するまでの間にダウンタイムが発生します。
そこでステージングスロットを活用し、ステージングスロットにデプロイ → 承認されたらスワップして本番に展開
という流れを設定する方法を説明します。

#### より再利用性の高い YAML を書く
いままで一つの YAML ファイルで記述してきましたが、この場合似たような設定を何度も書いたりと再利用性が高くありません。
そこで再利用性向上のために、一部の記述をまとめて外部ファイル化し、ファイル呼び出しにより処理を追加する方法を説明します。

#### YAML のテストをローカルから実行する
YAML を書いてパイプラインを作る場合、毎回コミット → テスト を行うとトライ&エラーで不要なコミット履歴が積み重なったりといったことが発生します。
Azure Pipelines には、それを見越して REST API 経由で YAML のテストを行う機能が備わっています。
ここでは、その API の使用方法について説明します。

<!--
### AzureDevOps の課題

- リポジトリが１つの時に１コミットで全部が回っちゃって AzureDevOps がつまっちゃう。
- ソリューションファイルがたくさんある
- チャットオプスつかう?
- プロジェクト立ち上げ時に簡単に環境構築できるのが良い
- 1 プロジェクト　 1 リポジトリ？
- GitTag とか使う
- Dev 環境は面倒


##### Boards

- WorkItems
- Boards
- Backlogs
- Sprints
- Queries

##### Repos

- Files
- Commits
- Pushes
- Branches
- Tags
- PullRequests

##### PipeLines

- Builds
- Release
- Library
- TaskGroups
- DeploymentGroups

##### Test Plan

- TestPlans
- Prpgressreport
- Parameters
- Configurations
- Runs

#### Artifacts
-->
<!--
### 必要なことや TODO(残課題)

- yaml 設定ファイルのジェネレーターを作る？
- yaml の面倒を見るのはだれか＝新しい方法が出たときのアップデート(.NET Core 3.0)
- テストを書くことと回すことは違う
- プロジェクト単位でワークスペースを分ける？？
- 式年遷宮の話、88 か所巡りをしている間に新しくなるような形が望ましい。(方法は検討)

### 参考

１：CICD を使用する理由
２：世の中にある CICD ツールの紹介（できれば比較も）
３：AzureDevOps を選択する理由
４：AzureDevOps の機能について説明・使い方
組織 → プロジェクト概念
Agent/AgentLess とか設定周りとか全体的を踏まえつつ機能を深堀
ここは機能ごとに別の章立てのほうがいいかもしれない。
５：Azure との連携
６：オリジナルタスクを作成して公開する
-->
