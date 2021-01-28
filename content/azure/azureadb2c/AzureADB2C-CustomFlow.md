---
title: "Webアプリの立上げと相性の良い Azure ADB2C　第3回(カスタムポリシーとは)"
authors:
  [
    ["Tsubasa Yoshino", "images/author/yoshinotsubasa.jpg"],
  ]
weight: 10
date: 2021-01-26
description: ""
type: "article"
category : "azure"
tags: ["Azure", "AADB2C", "Web Apps", "Azure AD B2C"]
eyecatch: "/images/eyecatch/deploy.png"
draft: false
---

## はじめに

[ユーザーフローの記事](/azure/azureadb2c/azureadb2c-userflow) では、AAD B2C の構築方法の簡単な説明と、
ユーザーフローの基本的な使い方を抑えました。

今回の記事では、前回名前だけ出てきたカスタムポリシーについて触れていこうと思います。

## カスタムポリシーとは

カスタムポリシーとは、前回の記事で扱ったユーザーフローよりもより複雑な処理に対応するために用意されている機能です。
XML を記述して AAD B2C のフローを構築していきます。

ユーザーフローでも一部、外部 API 呼出し等の機能が用意され始めていますが、カスタムポリシーを使用すれば、より柔軟に外部 API 呼出しを差し込んだり
といったことが可能になります。

主に出来る事としては、

* 入力項目のバリデーションの調整
  - 正規表現を用いたより複雑なバリデーションなど
* ユーザーフローが対応していない部分での外部 API 呼出し等の対応
* メールのカスタマイズ対応
  - 外部 API 呼出し機能により、RESTful API を提供しているメールプロバイダを使用可能

ユーザフローも大分実用的になりましたが、実際に運用に乗せる場合は、やはりカスタムポリシーを使用する場面が多くなるかと思います。

## 事例

カスタムポリシーは、弊社内でも使用しています。
その事例の一部をご紹介します。

このシステムでは、会員のサインアップ、サインイン機能をカスタムポリシーで実装しています。

{{<figure src="/azure/azureadb2c/images/part3/Case/01.png" title="サインイン画面">}}

{{<figure src="/azure/azureadb2c/images/part3/Case/02.png" title="サインアップ画面">}}

{{<figure src="/azure/azureadb2c/images/part3/Case/03.png" title="認証用メール">}}

ユーザーフローを触った方でしたら分かる通り、ユーザーフローでは、メールが Microsoft から送信されたといったようなメールになり、
メール文面も変更することが出来ません。
この事例では、SendGrid のテンプレートメールを使用してメール送信を行っているため、自由なメール文面に変更することが出来ています。

このような仕組みは、カスタムポリシーを使用すれば比較的簡単に実装することが可能です。

## カスタムポリシーで出来ること

カスタムポリシーは、主に下記のような事を行うことが可能です。

- 画面デザインの変更(HTML + CSS + JS)
- 収集項目の追加、削除
- 項目のバリデーション変更
- メールプロバイダの変更
- 各フローで外部サービスとの連携(外部のREST APIを叩くなど)  

## カスタムポリシーのひな型

Microsoft 公式で、カスタムポリシーのひな型を提供してくれているので、今回は、そのひな型を使いながら進行していきます。

[GitHub](https://github.com/Azure-Samples/active-directory-b2c-custom-policy-starterpack)

## カスタムポリシーでカスタマイズする

ここから早速カスタムポリシーを使って、カスタマイズしていきましょう

今回は、GitHub のひな型から、LocalAccounts のフォルダに入っているものを使用します。
ファイルの中身は、

* TrustFrameworkBase.xml
* TrustFrameworkExtensions.xml
* SignUpOrSignin.xml
* ProfileEdit.xml
* PasswordReset.xml

が含まれています。

### 各ファイルの役割

#### TrustFrameworkBase.xml

このファイルは、名前からも分かる通り、カスタムポリシーを構築するうえでの基本的な情報が記述されています。
主に、

* 顧客属性
* フローを実行するための各処理の実装

が含まれています。

このファイルは、基本的な情報が含まれているので変更は、最小限に留め的、Extension ファイルなどを変更して各案件単位で拡張していくことが推奨されます。

#### TrustFrameworkExtension.xml

ここでは、認証で何を行うかを決め使用する処理を呼び出す記述をします。

今回は、LocalAccount でのサインアップ、サインインなので、TrustFrameworkBase.xml に定義されている login-NonInteractive を呼び出しています。

SNS サインイン等を使用したい場合は、Base.xml に各 SNS 用の処理を追加したうえで、Extension.xml でその処理を呼び出して使用します。

#### SignUpOrSignin.xml

ここは、ユーザーフローで作成した SignInSignUp に該当する部分です。

今回は、Base.xml に定義されている SignUpOrSignIn を呼出しています。
OutputClaim に定義されている項目が、サインイン時にクライアントに返すクレームの項目です。

#### ProfileEdit.xml

ここは、ユーザ情報を編集するためのフローです。

Base.xml に定義された ProfileEdit を呼び出しています。

#### PasswordReset.xml

ここは、パスワードリセットをするためのフローです。

Base.xml の PasswordReset を呼び出しています。

これでわかる通り、基本的には、Base.xml に処理を追加し、それを各フローのファイルや Extension.xml で呼び出していくという流れになります。

### 動かしてみる

始めに、それぞれの XML ファイル内にある「yourtenant.onmicrosoft.com」を自身の B2C テナント名に差し替えます。

このファイルを、B2C にアップロードして動作確認してみましょう。

AAD B2C の管理画面 > Identity Experience Framework を選択して、カスタムポリシーの管理画面へ移動します。

{{< rawhtml >}}
<figure style="text-align:center">
  <img src="/azure/azureadb2c/images/part3/b2c/01.png" style="width:70%">
</figure>
{{< /rawhtml >}}

次に B2C にポリシーキーを登録します。
B2C では、シークレットと証明書をポリシーキーという形で保存し、連携するサービスとの間で信頼の確立に使用します。
これらは、主に外部の IdP との間での信頼確立といった場面で使用されます。


作成は、メニューのポリシーキーから移動します。

{{< rawhtml >}}
<figure style="text-align:center">
  <img src="/azure/azureadb2c/images/part3/b2c/03.png" style="width:70%">
</figure>
{{< /rawhtml >}}

キーの使用法を署名、名前を「TokenSigningKeyContainer」、キーの種類を RSA のキーと、キーの使用法を暗号化、名前を「TokenEncryptionKeyContainer」、キーの種類を RSA でそれぞれキーを生成します。

カスタムポリシーの管理画面に移動したら、画面上部の「カスタムポリシーをアップロードします」を選択して、ファイルをアップロードします。

{{< rawhtml >}}
<figure style="text-align:center">
  <img src="/azure/azureadb2c/images/part3/b2c/02.png" style="width:100%">
</figure>
{{< /rawhtml >}}

カスタムポリシーのファイルは、アップロードするタイミングで正しい定義になっているかといった整合性チェックを行った上で、カスタムポリシーを構築します。
そのため、Base ファイルから順番にアップロードする必要があることに注意してください。
なので今回は、下記の順番でアップロードします。

* TrustFrameworkBase.xml
* TrustFrameworkExtensions.xml
* SignUpOrSignin.xml
* ProfileEdit.xml
* PasswordReset.xml

上の手順を一通り行った上でアップロードすれば、エラーは、出ないはずです。
アップロードが完了すると、カスタムポリシーの項目にアップロードしたポリシーが表示されるはずです。

<!-- {{<figure src="/azure/azureadb2c/images/part3/b2c/04.png">}} -->

{{< rawhtml >}}
<figure style="text-align:center">
  <img src="/azure/azureadb2c/images/part3/b2c/04.png" style="width:70%">
</figure>
{{< /rawhtml >}}

実行したいカスタムポリシーを選択します。
今回は、signup_signin を選択します。
カスタムポリシーを選択すると、「今すぐ実行」のボタンが表示されるので、実行します。

<!-- {{<figure src="/azure/azureadb2c/images/part3/b2c/05.png">}} -->

{{< rawhtml >}}
<figure style="text-align:center">
  <img src="/azure/azureadb2c/images/part3/b2c/05.png" style="width:70%">
</figure>
{{< /rawhtml >}}

実行すると下図のような画面が表示されるはずです。

<!-- {{<figure src="/azure/azureadb2c/images/part3/b2c/06.png">}} -->

{{< rawhtml >}}
<figure style="text-align:center">
  <img src="/azure/azureadb2c/images/part3/b2c/06.png" style="width:70%">
</figure>
{{< /rawhtml >}}

では、これから色々と調整して実験をしてみましょう
### バリデーションの変更

まず手始めにメールアドレスのバリデーションをカスタマイズしてみます。

このひな型で使われているメールアドレスのバリデーションは、下記の正規表現になっています。

```
^[a-zA-Z0-9.!#$%&amp;'^_`{}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$
```

この正規表現だと、test@test.com のようなメールアドレスは、通るのですが、
Gmail のプレフィックス機能を使った場合等に発生する
test+hoge@sigmact.com

といったメールアドレスが通りません。

実際にサインアップ画面で試してみると下図のようにエラーが出ます。

{{< rawhtml >}}
<figure style="text-align:center">
  <img src="/azure/azureadb2c/images/part3/b2c/07.png" style="width:70%">
</figure>
{{< /rawhtml >}}

+ が原因でバリデーションを突破出来ないというのが理由なのですが、このメールは、RFC に準拠しているということや、テストでアカウントを大量に作りたい場合に
使えると便利なので、使えるように変更します。

これは、TrustFrameworkBase.xml の email 属性を調整します。

オリジナルは、下記のコードです。

``` xml
<ClaimType Id="email">
  <DisplayName>Email Address</DisplayName>
  <DataType>string</DataType>
  <DefaultPartnerClaimTypes>
    <Protocol Name="OpenIdConnect" PartnerClaimType="email" />
  </DefaultPartnerClaimTypes>
  <UserHelpText>Email address that can be used to contact you.</UserHelpText>
  <UserInputType>TextBox</UserInputType>
  <Restriction>
    <Pattern RegularExpression="^[a-zA-Z0-9.!#$%&amp;'^_`{}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$" HelpText="Please enter a valid email address." />
  </Restriction>
</ClaimType>
```

このコードの RegularExpression の部分に新しく適用したい正規表現を入力します。
今回は、下記の正規表現を使用します。

```
^[a-zA-Z0-9!$&amp;*=^`|~#%'+\/?_{}-][a-zA-Z0-9!$&amp;*.=^`|~#%'+\/?_{}-]*@([a-zA-Z0-9_-]+\.)+[a-zA-Z0-9]+$
```

``` xml
<ClaimType Id="email">
  <DisplayName>Email Address</DisplayName>
  <DataType>string</DataType>
  <DefaultPartnerClaimTypes>
    <Protocol Name="OpenIdConnect" PartnerClaimType="email" />
  </DefaultPartnerClaimTypes>
  <UserHelpText>Email address that can be used to contact you.</UserHelpText>
  <UserInputType>TextBox</UserInputType>
  <Restriction>
    <Pattern RegularExpression="^[a-zA-Z0-9!$&amp;*=^`|~#%'+\/?_{}-][a-zA-Z0-9!$&amp;*.=^`|~#%'+\/?_{}-]*@([a-zA-Z0-9_-]+\.)+[a-zA-Z0-9]+$" HelpText="Please enter a valid email address." />
  </Restriction>
</ClaimType>
```

変更したら先ほどと同じ手順でアップロードします。
今回は、「カスタムポリシーが既に存在する場合は上書きする」に必ずチェックを入れましょう。

アップロードが完了したら動かしてみましょう。

今回は、+ が含まれていてもバリデーションエラーになりませんでした。

{{< rawhtml >}}
<figure style="text-align:center">
  <img src="/azure/azureadb2c/images/part3/b2c/08.png" style="width:70%">
</figure>
{{< /rawhtml >}}
## メールプロバイダの変更

次にメールプロバイダを変更してみましょう。

メールアドレス認証用のメールですが、標準では、下図のようなメールテンプレートになっています。
またこのテンプレートを細かく調整することが難しかったり、差出人や件名などの調整が細かくてできなかったりと
なんだか微妙な内容になっているので、実案件で使用するのは、少し考え者です。


{{< rawhtml >}}
<figure style="text-align:center">
  <img src="/azure/azureadb2c/images/part3/b2c/09.png">
</figure>
{{< /rawhtml >}}
### メールプロバイダ変更の実装例

今回は、下図のような構成を構築します。

{{< rawhtml >}}
<figure style="text-align:center">
  <img src="/azure/azureadb2c/images/part1/Diagram03.png" style="width:90%">
</figure>
{{< /rawhtml >}}

主な作業としては、

- SendGrid のアカウント開設(省略)
- SendGrid でメールテンプレートを作る(省略)
- SendGrid に変数定義する
- SendGrid の API 用に、入力を JSON に変換する処理を作る
- 認証コード(Otp) の処理機能を定義する
- Otp 送信機能を定義する
- 画面コントロールを作る

です。

### SendGrid の API へ送るリクエスト生成処理を追加する

ここでは、カスタムポリシーの ClaimsTransformation を使用して、入力された値を json に変換して出力する処理を追加します。
Base.xml の ClaimsTransformations の中に、次のようなコードを入れます。

``` xml
<ClaimsTransformation Id="GenerateEmailRequestBody" TransformationMethod="GenerateJson">>
  <InputClaims>
    <InputClaim ClaimTypeReferenceId="email" TransformationClaimType="personalizations.0.to.0.email" />
    <InputClaim ClaimTypeReferenceId="otp" TransformationClaimType="personalizations.0.dynamic_template_data.otp" />
    <InputClaim ClaimTypeReferenceId="email" TransformationClaimType="personalizations.0.dynamic_template_data.email" />
  </InputClaims>
  <!-- 定数を入れる箇所 -->
  <InputParameters>
      <!-- SendGrid のテンプレートId -->
      <InputParameter Id="template_id" DataType="string" Value="メールテンプレート Id"/>    
      <!-- From のメアド -->
      <InputParameter Id="from.email" DataType="string" Value="info@test.com"/> 
      <!-- メールの件名 -->
      <InputParameter Id="personalizations.0.dynamic_template_data.subject" DataType="string" Value="メールアドレスの確認コード"/> 
  </InputParameters>
  <!-- 定数を入れる箇所ここまで -->
  <OutputClaims>
    <OutputClaim ClaimTypeReferenceId="emailRequestBody" TransformationClaimType="outputClaim"/>
  </OutputClaims>

</ClaimsTransformation>
```

InputClaim と InputParameter で入力された値を、TransformationMethod で指定した方法(今回は、json への変換)をして、出力しています。

C# で書くと次のようなコードのイメージになります。

```csharp
public class Demo
{
    public string email { get; set; }
    public string otp { get; set; }
    public string requestBody { get; set; }
    public void TransformJson()
    {
        var obj = new 
        {
            "personalizations.0.to.0.email" : email,
            "personalizations.0.dynamic_template_data.email": email,
            "personalizations.0.dynamic_template_data.otp": otp,
            "template_id": "d-9614a4570e4445dbb917554920cf9d75",
            "from.email": "info@contso.com",
            "personalizations.0.dynamic_template_data.subject": "件名"
        };
        requestBody = JsonConvert.SerializeObject(obj);
    }
}
```

### Otp の処理を定義する

次に、Otp の生成処理を追加します。

Base.xml のClaimsProviders の中に次のコードを定義します。

``` xml
<ClaimsProvider>
  <DisplayName>One time password technical profiles</DisplayName>
  <TechnicalProfiles>
    <TechnicalProfile Id="GenerateOtp">
      <DisplayName>Generate one time password</DisplayName>
      <Protocol Name="Proprietary" Handler="Web.TPEngine.Providers.OneTimePasswordProtocolProvider, Web.TPEngine, Version=1.0.0.0, Culture=neutral, PublicKeyToken=null" />
      <Metadata>
        <Item Key="Operation">GenerateCode</Item>
        <Item Key="CodeExpirationInSeconds">1200</Item> <!-- コードの有効期限 -->
        <Item Key="CodeLength">6</Item>
        <Item Key="CharacterSet">0-9</Item>
        <Item Key="ReuseSameCode">true</Item>
        <Item Key="MaxNumAttempts">5</Item>
      </Metadata>
      <InputClaims>
	   <!– Otp 用の処理に値を渡す -->
        <InputClaim ClaimTypeReferenceId="email" PartnerClaimType="identifier" />
	　 <!– Otp 用の処理に値を渡す -->
      </InputClaims>
      <OutputClaims>
	   <!– Otp 用の処理から値を貰う -->
        <OutputClaim ClaimTypeReferenceId="otp" PartnerClaimType="otpGenerated" />
	   <!– Otp 用の処理から値を貰う -->
      </OutputClaims>
    </TechnicalProfile>
    <TechnicalProfile Id="VerifyOtp">
      <DisplayName>Verify one time password</DisplayName>
      <Protocol Name="Proprietary" Handler="Web.TPEngine.Providers.OneTimePasswordProtocolProvider, Web.TPEngine, Version=1.0.0.0, Culture=neutral, PublicKeyToken=null" />
      <Metadata>
        <Item Key="Operation">VerifyCode</Item>
      </Metadata>
      <InputClaims>
        <InputClaim ClaimTypeReferenceId="email" PartnerClaimType="identifier" />
        <InputClaim ClaimTypeReferenceId="verificationCode" PartnerClaimType="otpToVerify" />
      </InputClaims>
    </TechnicalProfile>
    </TechnicalProfiles>
</ClaimsProvider>
```

ここには、GenerateOtp と VerifyOtp の二つの処理を定義しました。

GenerateOtp は、
``` xml
<Protocol Name="Proprietary" Handler="Web.TPEngine.Providers.OneTimePasswordProtocolProvider, Web.TPEngine, Version=1.0.0.0, Culture=neutral, PublicKeyToken=null" />
```
でどんな処理を呼び出すか指定し、email の値を InputClaim で受け取り、OutputClaim で otp に値を格納します。

VerifyOtp は、GenerateOtp 同様に OTP 用のプロトコルを定義し、email と Otp を受け取って整合性をチェックする処理を提供します。

C# で書くと次のようなイメージの事をしています。

```csharp
void Main()
{
  var email = "demo@contso.com";
  var otpManager = new OtpManager();
  string otp = otpManager.GenerateOtp(email);

    var verify = otpManager.VerifyOtp(email, otp);
}

public class Otp
{
  public string Email { get; set; }
  public string Code { get; set; }
}

public class OtpManager
{
  public string Operation { get; set; }
  public int CodeExpirationInSeconds { get; set; }
  public int CodeLength { get; set; }
  public string CharacterSet { get; set; }
  public bool ReuseSameCode { get; set; }
  public int MaxNumAttempts { get; set; }

  private Otp otp { get; set;}

  public string GenerateOtp(string identifier)
  {
    otp = new Otp
    {
    Email = identifier, 
    Code = "12345"
    };

    return otp.Code;
  }


  public bool VerifyOtp(string identifier, string otpToVerify)
  {
    return otp.Code == otpToVerify && otp.Email == identifier;
  }
}
```

### メール送信を実装する

次に、メール送信の機能を定義します。
ここでは、SendGrid の REST API を呼び出すように REST API 呼出しの機能を定義します。

最初に SendGrid の API キーを AAD B2C に登録します。

カスタムポリシーの管理画面 > ポリシーキー の項目で、
* オプション : 手動
* 名前 : SendGridSecret
* シークレット : SendGrid の API キー
* キー使用法 : 署名

でキーを登録します。

登録が完了したら、次のコードを Base.xml の ClaimsProvider の下に追加します。

``` xml
<ClaimsProvider>
  <DisplayName>RestfulProvider</DisplayName>
  <TechnicalProfiles>
    <TechnicalProfile Id="SendOtp">
      <DisplayName>Use SendGrid's email API to send the code the the user</DisplayName>
      <Protocol Name="Proprietary" Handler="Web.TPEngine.Providers.RestfulProvider, Web.TPEngine, Version=1.0.0.0, Culture=neutral, PublicKeyToken=null" />
      <Metadata>
        <Item Key="ServiceUrl">https://api.sendgrid.com/v3/mail/send</Item>
        <Item Key="AuthenticationType">Bearer</Item>
        <Item Key="SendClaimsIn">Body</Item>
        <Item Key="ClaimUsedForRequestPayload">emailRequestBody</Item>
      </Metadata>
      <CryptographicKeys>
        <Key Id="BearerAuthenticationToken" StorageReferenceId="B2C_1A_SendGridSecret" />
      </CryptographicKeys>
      <InputClaimsTransformations>
        <InputClaimsTransformation ReferenceId="GenerateEmailRequestBody" />
      </InputClaimsTransformations>
      <InputClaims>
        <InputClaim ClaimTypeReferenceId="emailRequestBody" />
      </InputClaims>
    </TechnicalProfile>
  </TechnicalProfiles>
</ClaimsProvider>
```

これは、REST API を呼び出すための設定です。
CryptographicKeys > Key > StorageReferenceId にポリシーキーで作成したキーの名前を指定します。

### 画面コントロールを定義する

次に、メールアドレスと 受け取った Otp を入力するための画面コントロールを定義します。

画面コントロールは、主に

* InputClaim
* DisplayClaim
* OutputClaim
* Action

で構成されます。

それぞれの役割としては、

#### InputClaim

* ユーザからの入力を事前に埋めておくために使用する
* 例えば、ユーザ情報から取得できる名前を初めから埋めておく等
#### DisplayClaim

* ユーザからの入力を受け付ける項目

#### OutputClaim

* このコントロール用に一時的に保存される項目
* このフローの次のフローなどに値を引き回したい場合は、OutputClaim に値をセットする

#### Action

* 画面内で実行される処理を定義する
* Otp を生成したりする場合は、ここに処理をセットする

今回は、

* メールアドレス、Otp を受け取る
* Otp を生成する
* Otp をメールで送信する
* Otp を検証する

機能を持ったコントロールを実装します。

次の XML を Base.xml の BuildingBlocks の中に定義します。

``` xml
<DisplayControls>
  <DisplayControl Id="emailVerificationControl" UserInterfaceControlType="VerificationControl">
    <DisplayClaims>
      <DisplayClaim ClaimTypeReferenceId="email" Required="true" />
      <DisplayClaim ClaimTypeReferenceId="verificationCode" ControlClaimType="VerificationCode" Required="true" />
    </DisplayClaims>
    <OutputClaims>
      <OutputClaim ClaimTypeReferenceId="email" />
    </OutputClaims>
    <Actions>
      <Action Id="SendCode">
        <ValidationClaimsExchange>
          <ValidationClaimsExchangeTechnicalProfile TechnicalProfileReferenceId="GenerateOtp" />
          <ValidationClaimsExchangeTechnicalProfile TechnicalProfileReferenceId="SendOtp" />
        </ValidationClaimsExchange>
      </Action>
      <Action Id="VerifyCode">
        <ValidationClaimsExchange>
          <ValidationClaimsExchangeTechnicalProfile TechnicalProfileReferenceId="VerifyOtp" />
        </ValidationClaimsExchange>
      </Action>
    </Actions>
  </DisplayControl>
</DisplayControls>
```

SendGrid のアカウントと、メールテンプレートを使用するのでその二つについては、予めご用意ください。

### ページレイアウトの修正

使用しているひな型ですと、使用するページレイアウトのバージョンが古いため新しいものに切り替えます。

まずひな型に含まれているレイアウト指定の箇所は、次のコードです。

``` xml
<ContentDefinition Id="api.localaccountsignup">
  <LoadUri>~/tenant/templates/AzureBlue/selfAsserted.cshtml</LoadUri>
  <RecoveryUri>~/common/default_page_error.html</RecoveryUri>
  <DataUri>urn:com:microsoft:aad:b2c:elements:selfasserted:1.1.0</DataUri>
  <Metadata>
    <Item Key="DisplayName">Local account sign up page</Item>
  </Metadata>
</ContentDefinition>

<ContentDefinition Id="api.localaccountpasswordreset">
  <LoadUri>~/tenant/templates/AzureBlue/selfAsserted.cshtml</LoadUri>
  <RecoveryUri>~/common/default_page_error.html</RecoveryUri>
  <DataUri>urn:com:microsoft:aad:b2c:elements:selfasserted:1.1.0</DataUri>
  <Metadata>
    <Item Key="DisplayName">Local account change password page</Item>
  </Metadata>
</ContentDefinition>
```

このコードの DataUri を新しいものに切り替えます。
切替後のコードは、次の通りです。

``` xml
<ContentDefinition Id="api.localaccountsignup">
  <LoadUri>~/tenant/templates/AzureBlue/selfAsserted.cshtml</LoadUri>
  <RecoveryUri>~/common/default_page_error.html</RecoveryUri>
  <DataUri>urn:com:microsoft:aad:b2c:elements:contract:selfasserted:2.1.0</DataUri>
  <Metadata>
    <Item Key="DisplayName">Local account sign up page</Item>
  </Metadata>
</ContentDefinition>

<ContentDefinition Id="api.localaccountpasswordreset">
  <LoadUri>~/tenant/templates/AzureBlue/selfAsserted.cshtml</LoadUri>
  <RecoveryUri>~/common/default_page_error.html</RecoveryUri>
  <DataUri>urn:com:microsoft:aad:b2c:elements:contract:selfasserted:2.1.0</DataUri>
  <Metadata>
    <Item Key="DisplayName">Local account change password page</Item>
  </Metadata>
</ContentDefinition>
```

### 作成したコントロールを呼び出す

ここで実際に、先ほど作成したコントロールを呼び出して動かしてみましょう。

LocalAccountSignUpWithLogonEmail の TechnicalProfile 内にある InputClaims を始めに削除します。
次に、下記のコードを追加します。

``` xml
<DisplayClaims>
  <DisplayClaim DisplayControlReferenceId="emailVerificationControl"></DisplayClaim>
</DisplayClaims>
```

これで実際に動かすと、次のような画面になります。

{{< rawhtml >}}
<figure style="text-align:center">
  <img src="/azure/azureadb2c/images/part3/b2c/10.png" style="width:70%">
</figure>
{{< /rawhtml >}}


メールアドレスを入力して、コードを発行してみるとメールが飛んでくるはずです。

メールが飛んで来たら、これでメールのカスタマイズは、完成です。

## まとめ

ここまでで、カスタムポリシーの簡単な構成を行った上で、項目のカスタマイズ、メールのカスタマイズ、REST API 呼出しの方法について触れていきました。

ここまでくれば概認証システムとしては、実践投入できるレベルになるかと思います。

これ以外のシナリオですと、例えば AAD 外の情報(Dynamics や Salesforce などの CRM に入っている情報など)と連携するような構成が考えられます。
その場合も、今回のメール送信の様に REST API を用意して情報のやり取りをする形を取ることで実現可能です。

次回は、API 呼出しを少し発展させ、AAD B2C で API Management を保護し、セキュアな API 呼出しを実現する方法について触れていこうと思います。

## サンプルのダウンロード

カスタムポリシーに関する公式のドキュメントやサンプルコードなどは、豊富に用意されているので一部を紹介します。

- [公式ドキュメント](https://docs.microsoft.com/en-us/azure/active-directory-b2c/)
- [サンプルコード](https://github.com/azure-ad-b2c/samples)

[AAD B2C で API Management を保護するに続きます。](/azure/azureadb2c/azureadb2c-apimanagement)
