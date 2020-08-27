---
title: 'App Service でゼロからヒーロー Part 5: App service のWEBアプリケーションにセキュアなカスタムドメインを設定する'
author_name: "Yutang Lin"
tags: 
    - zero to hero
toc: true
toc_sticky: true
---

この記事は [App Service でゼロからヒーロー](https://azure.github.io/AppService/tags/#zero-to-hero) シリーズの第5回です。
この記事を読むためには[初回記事]({{ site.baseurl }}{% link _posts/2020-06-29-zero_to_hero_pt1.md %})を読み終えていることを想定しています。

もし、“azurewebsites.net”以外のドメイン名をWebアプリケーションに当てたい場合、カスタムドメインをWebアプリケーションに足すことができます。
それ以上に、カスタムドメインを App Service Managed Certificates の無償の証明書でセキュアにすることができます。
サイトを閲覧しに訪れる顧客も安心することでしょう。

## 事前準備

Webアプリケーションにカスタムドメインを当てる前に、既にカスタムドメインを購入してある必要があります。
カスタムドメインを持っていない場合は、 [本記事の App Service Domain セクションを読んで](#app-service-domain)App Service Domainsを通じて購入することができます。既にカスタムドメインを持っている場合は、
[adding of custom domain to your web app section of the article](#add-custom-domain)に進んで大丈夫です。

## App Service Domains <a name="app-service-domain"></a>

App Service Domains lets you create and manage domains hosted on Azure DNS through the Azure portal. The domain can be used for services such as Web Apps, Traffic Manager, and etc.. Purchasing an App Service Domain also provides the added benefit of privacy protection: your personal data will be protected from the WHOIS public database for free. This is often costs extra with other domain registrars. This product can auto-renew your domains and it integrates easily with your web apps.

To create your App Service Domain, you can click on this link [here](https://ms.portal.azure.com/#create/Microsoft.Domains) or you can head to the Azure portal and search for “App Service Domain”.  

![App Service Domain]({{site.baseurl}}/media/2020/07/Create-ASD.PNG){: .align-center}

In the domain search bar, type the domain name you would like to purchase. If you don’t see the name in the list of available domains, then the domain isn’t available for purchase. However, you can choose from the suggested list of available domains or enter a new domain you would like to purchase. In the “Contact information” tab, enter your personal information. Then in the “Advanced” tab, choose whether you want to set up auto-renew for the domain. Domain auto-renew prevents accidental loss of domain ownership after expiration. Lastly, decide whether you would like to add privacy protection at no extra charge. Go to “Review + create” to review the legal terms, verify the domain information, and click “Create”. Once your domain has successfully been created, you can now [add your custom domain to your web app](#add-custom-domain). 

## Adding a custom domain to your web app <a name="add-custom-domain"></a>

To add a custom domain to your web app, you will need to update your domain’s DNS records. If you purchased an App Service Domain, the DNS records will be updated for you automatically and you can proceed to [verifying and adding custom domain](#verify-add-domain). Otherwise, you will need to [update your DNS records](#upate-dns). 

### DNSレコードの更新 <a name="upate-dns"></a>

カスタムドメインのverification IDをWebアプリケーション用に取得する必要があります。
このトークンは、ドメインの所有を確認するために使われます。
“Custom domains”タブからこの値を取得できます。

![Custom Domain Verification ID]({{site.baseurl}}/media/2020/07/Get-CDVID.png){: .align-center}

IDを取得して、ドメインプロバイダーのサービスに行きます。ドメインプロバイダーのサービス上でDNSレコードでCNAMEとTXTレコードを追加します。
例として、wwwのサブドメインをマップします。

| Record Type  | Host       | Value                          |
|--------------|------------|--------------------------------|
| CNAME        | www        | <app-name>.azurewebsites.net   |
| TXT          | asuid.www  | Custom Domain Verification ID  |

DNSレコードは、この例のように表示されるはずです。

![Custom Domain Verification ID]({{site.baseurl}}/media/2020/07/dns-records.png){: .align-center}

### 検証とカスタムドメインの追加 <a name="verify-add-domain"></a>

DNSレコードを更新した後で(if not using App Service Domain):

1. App Service に行き、“Settings” セクションの下の “Custom domain” に遷移します。
1. “Add custom domain” ボタンをクリックします。
1. 使いたいドメイン名を入力します。
1. “Validate”ボタンをクリックします。
1. DNSレコードを正常に更新していたら、“add custom domain”のオプションが確認できます。そうでない場合、前のセクションに戻って、正確に[updated your DNS records](#upate-dns)の対応ができたか確認してください。“add custom domain”をクリックします。

![Custom Domain Verification ID]({{site.baseurl}}/media/2020/07/Add-Custom-Domain.png){: .align-center}

カスタムドメインにがWebアプリケーションに正常に追加されると、“Assigned Custom Domains”のリストで確認できます。
これらのドメイン名を使って、作業できます。

もしカスタムドメインに証明書を当てたい場合、 次のセクション[Creating an App Service Managed Certificate](#asmc)に進んでください。

## App Service Managed Certificate の作成<a name="asmc"></a>

無償でカスタムドメインに証明書を当てたい場合、App Service Managed Certificate で作成して、自分のドメインにバインドできます。
Managed Certificatesがあれば、証明書が自動で更新されるされるので心配する必要はありません。

1. Webアプリケーションまで行き、“Settings”の下にある“TLS/SSL settings”を選びます。
1. “Private Key Certificates” ブレードをクリックします。
1. “Create App Service Managed Certificate” をクリックします。

![Custom Domain Verification ID]({{site.baseurl}}/media/2020/07/Cert-Blade.png){: .align-center}
  
ドロップダウンメニューから証明書を作成したいドメインを選んで“Create”を押下します。

![Custom Domain Verification ID]({{site.baseurl}}/media/2020/07/Create-Free-Cert.png){: .align-center}

証明書が作成されると、“TLS/SSL Settings”のブレードから確認する事ができます。
自分のドメインにこの証明書を当てるために、次のセクション[binding your certificate to your web app](#create-binding)で説明されるドメインに証明書をバインドする必要があります。

![Custom Domain Verification ID]({{site.baseurl}}/media/2020/07/Free-Cert-Created.png){: .align-center}

## Webアプリケーションに証明書をバインドする <a name="create-binding"></a>

ドメインをセキュアにする最後のステップとして、ドメインに証明書をバインドします。
ポータルで、Webアプリケーションを選択し、“Settings”の下にある“Custom domain”を選びます。
“Assigned Custom Domains”から証明書を当てたいドメインを選択し、“Add binding”をクリックします。

![Custom Domain Verification ID]({{site.baseurl}}/media/2020/07/Binding-Option.png){: .align-center}

次のブレードで 
1. 正しいカスタムドメインを選択
1. ドロップダウンから作成したばかりの App Service Managed Certificate を選択
1. TLS/SSLのタイプに“SNI SLL” を選択
1. “Add Binding”をクリック

![Custom Domain Verification ID]({{site.baseurl}}/media/2020/07/Add-Binding.png){: .align-center}

バインディングが成功すると、グリーンのチェックマークと “安全” というワードが、“Assigned Custom Domains” リストのドメイン名の横に表示されます。

## まとめ

おめでとう。この記事で、App Serviceにセキュアなカスタムドメインを設定できるようになりました。
顧客も新しいドメインにセキュアに閲覧できるようになりました。

## 役に立つリンク

- [Tutorial: Map an existing custom DNS name to Azure App Service](https://docs.microsoft.com/azure/app-service/app-service-web-tutorial-custom-domain)
- [Add a TLS/SSL certificate in Azure App Service](https://docs.microsoft.com/azure/app-service/configure-ssl-certificate#create-a-free-certificate-preview)