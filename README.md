# Proprietary Cohorts

## Introduction

Today, online advertising systems rely on 3rd party cookies, which store the cross-publisher IDs, to group users into audience segments or cohorts using sophisticated algorithms based on their browsing behavior. Marketers use these cohorts to match advertising content to the users who are likely to be the most receptive. They are then able to record which users, and cohorts, generated better marketer success metrics (e.g., visited the marketer website, purchased the marketer’s product) to determine how to adjust their budgeting and targeting of future content.

The ultimate goal of this system provides benefits for everyone involved. Users get to see fewer and more relevant ads, advertisers get to reach more responsive people, and the measured effectiveness enables marketers to shift more budget to the publishers frequented by this audience, This in turn more effectively monetizes their content.

However, the use of individual user ids across page domains, made possible by 3rd party cookies comes at a cost; it allows for uncomfortable sharing of a users’ browsing habits with marketers, and of marketer-defined user interests and potential buying habits with publishers.

This proposal suggests a solution that will enable proprietary grouping of users into cohorts based on their browsing behavior in a way that addresses both marketer needs as well as the privacy and security concerns of sharing data with non-permissioned recipients. Equally important, this document looks to provide a workable alternative to encapsulating all decisioning in the browser (like Turtledove) or requiring a centralized governing body to make decisions on what is or is not allowed (like Sparrow). If properly architected, the defined communications protocol between browser and “cohort provider” can achieve the twin goals of removing decision-making within centralized nodes (either browser or gatekeeper) and also allows an open, competitive marketplace of organizations to serve as cohort providers. 

## API Example Flow

A website (news-publisher.example) who chooses to utilize proprietary cohorts adds a new html tag to the page header:

```
<link rel="cohort-classification" href="https://cohort-provider.example/classifier.js">
```

A supporting browser reads this tag and executes a request to `https://cohort-provider.example/classifier.js` to retrieve a javascript file that will be used to classify the user locally into a cohort.

An extremely simple example of this function might be:

```
function classifier(storedData, currentUrl) {
	storedData.push(currentUrl);
	return randomNumberBetween(0, 999); // obviously we’d want to use some of that sweet sweet stored data, but I couldn’t think of a simple way to express that.
};
```

The function would be executed in a sandbox and only have access to the current page url and an object containing state set by a previous call to this function.

The classification function would also have the ability to leverage the aggregate reporting api to send data back to the cohort provider for use in improving the classification algorithm.

The function would return a CohortID which the browser would make available to the publisher via a JS API.


```
navigator.getCohortId();
```

Publishers could use this Cohort ID both for internal analytics purposes and forward it to marketers in ad requests. Marketers could use this Cohort ID to identify which cohorts are engaging most with their brand and could allocate more budget to publishers who attract users in this cohort to their properties.

This system would provide for the needed advertising functionality of both publishers and buyers while protecting users’ privacy.

### High Level Flow Diagram
![High level flow diagram](https://user-images.githubusercontent.com/14223042/93375304-370fb780-f815-11ea-8354-cea10e962915.png)

### Sequence Diagram
![High level flow diagram](https://user-images.githubusercontent.com/14223042/93375312-3840e480-f815-11ea-95d0-d031251da312.png)

## Design Elements

### Cohort Classifier Request

The browser will request the classification function from the Cohort Provider in a cookieless request.

It will not be effecient to make a request for a new classification function on every page load so some caching of this function should be done on the client. If there are no identified privacy risks, it is preferable to allow the Cohort Provider to set the TTL of this cache in the response header. 



### Cohort Classification Function

The Cohort Classification Function should be executed in a sandbox that does not allow for any external communication. The function should be provided with two parameters `storedData` and `currentUrl`.

#### storedData
This is a javascript object that can be read and modified by the function. It is intended to hold state used for ongoing classification based on user browsing behavior.

This should be clearable by the user if they indicate they want to clear their browsing history.

#### currentUrl
This is a string containing the full url of the current page. It is possible this url could contain a unique identifier for the user but this would provide no value to the classifier as its only output is a cohortID and thus should not be a a privacy concern.

#### output

The classification function will return a cohort ID which should be a string representing a hexidecimal number.

### Cohort IDs

A cohort ID indicates which cohort a client belongs to. In order to ensure these IDs are not used to identify a unique user, the client can ensure a cohort ID has a minimum number of users before allowing it access in the browser.

### Header Tag

The header tag is used to indicate a given publisher page is opting in to using a cohort provider's classification function as well as sharing page-load information via the aggregate reporting api.

This opt-in / registration could also be done as a javascript API. Something like:

```
navigator.registerCohort("https://cohort-provider.example/classifier.js");
```

### Cohort Provider

The cohort provider can be any entity. It is responsible for providing an classification function to the browser that groups users into effective cohorts for the publisher.

Cohort providers never receive any individual users browsing data, only data from the aggregate reporting api.

## Information available to each party

### Webpage

The hypertext document a user is viewing. The webpage must opt-in to sharing page-view information with a Cohort Provider by including a cohort provider header tag.

Within the scope of this proposal, the only information provided to the website is a CohortId.

This proposal does not make a technical distinction between a Publisher and a Marketer/Advertiser, all webpages are treated equally.

### Classification function

The classification function is generated by the cohort provider and provided to the client with no knowledge of who will be recieving it. We must assume the the classification function has access to any information the Cohort Provider has access to prior to the classification function request.

In addition, the classification function is provided with the url of the current page along with the ability to persist this url (or any information derived therefrom).

### Cohort Provider

The Cohort Provider is any entity who provides a classification function to a web page.

Any data the classification function has access to could be sent to the cohort provider via the aggregated reporting api. We would expect this to be aggregate page view data such as:

```
{
 ‘cohortID’: 'abc123',
 'domain': 'foo.com',
 'visits': '12'
}
```

## Benefits

* People who like ads that remind them of sites they're interested in can choose to keep seeing those sorts of ads.
* People who don't like these types of ads can choose to stop sending their current (or any) cohort signal.
* Advertisers cannot learn the browsing habits of individual users, even those who have joined multiple interest groups.
* Publishers learn only the single cohortId of the people who visit them (much like FLoC).
* Marketers can retain campaign control and performance in so far as this does not infringe user privacy.
* Appropriate control over ad safety, brand safety and transparency in billing is provided to both advertisers and publishers.
* User experience while browsing the web is preserved.
* Publishers and Marketers have an open market choice of who provides the best cohort solution for their individual needs. 

## Trade Offs

### Minimum Cohort Membership Size

Cohort membership size must be large enough to protect the privacy of each member. However, a system with smaller, more granular cohorts is more flexible and can provide more value to marketers.

## Privacy and Security Considerations

This proposal shares many of the privacy concerns as FLoC. 

### Revealing People’s Interests to the Web

This API democratizes access to some information about an individual’s browsing history on any site that opts into the same cohort provider. This is in contrast to today’s world, in which cookies or other tracking techniques may be used to collate someone’s browsing activity across many sites and potentially tie that information to a user’s PII.

However, sites that know a person’s PII (e.g., when people sign in using their email address) could record and reveal their Cohort ID. This means that information about an individual's interests may eventually become public. This is not ideal, but still better than today’s situation in which PII can be joined to exact browsing history obtained via third-party cookies.

As such, there will be people for whom providing this information in exchange for funding the web ecosystem is an unacceptable trade-off. Whether or not the browser sends a Cohort ID is user controllable.

### Tracking people via their Cohort ID

A Cohort ID could be used as a user identifier. It may not have enough bits of information to individually identify someone, but in combination with other information (such as an IP address), it might. One design mitigation is to ensure Cohort ID sizes are large enough that they are not useful for tracking. The Privacy Budget explainer points towards another relevant tool that Cohort IDs could be constrained by.

### Sensitive Categories

A Cohort ID might reveal sensitive information. As a first mitigation, the client could remove sensitive sites from its data collection. But this does not mean sensitive information can’t be leaked. Some people are sensitive to categories that others are not, and there is no globally accepted notion of sensitive sites.

It should be clear that usage of Cohort IDs will never be able to prevent all misuse. There will be information that is sensitive in contexts that weren't predicted. Beyond Proprietary Cohort’s technical means of preventing abuse, sites that use Cohort IDs will need to ensure that people are treated fairly, just as they must with algorithmic decisions made based on any other data today.

## Extensions

### Multiple Providers
a single first party (domain or set) could send data to multiple providers, but can only receive a cohort from one. This will enable advertisers to provide info that can enable effective ads on publishers that might use different cohort providers but prevent the joining of cohort ids to a single first party id for fingerprinting purposes.
    
## Related Proposals
* [FLoC](https://github.com/jkarlin/floc)
* [SPARROW](https://github.com/WICG/sparrow)
* [TURTLEDOVE](https://github.com/WICG/turtledove)
