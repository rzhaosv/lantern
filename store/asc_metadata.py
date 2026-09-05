"""Set Wisp App Store metadata + screenshots via ASC API. Idempotent. Run from landed/.credentials with PYTHONPATH=."""
import asc, json, os, glob, time
APP='6808837553'
SHOTS=sorted(glob.glob('/Users/raymondzhao/workspace/lantern/store/screenshots/0*.png'))
DESC="""For the days when something feels missing and you can't name it. Brain fog. A low that won't lift. Going through the motions. Lantern is a seven-minute daily ritual that meets you there and asks very little.

SEVEN MINUTES, ONE SMALL LIGHT
Each day has four short steps: a minute of stillness, a story, one small practice you can actually do, and a single line to carry with you. That's it. No lectures, no streak shaming, no homework.

TWENTY-ONE STORIES THAT MEET YOU WHERE YOU ARE
Short stories retold in plain, modern language about being lost and found, about rest, about small seeds, about coming home. They are old stories, told gently, and they tend to land on the days you need them most.

ONE THING YOU CAN ACTUALLY DO
Rest for twenty minutes without a screen. Text one person a thank-you. Give something away. Write down three true things. Small practices that move something.

A FLAME THAT GROWS
Your lantern's flame grows brighter over 21 days as you show up. Miss a day? It waits. Nothing resets.

SET IT DOWN
The Let Go game lets you name the things you're carrying and drop them, one stone at a time, into still water.

PRIVATE BY DESIGN
No account, no sign-in, no server. Your reflections stay on your phone. Reminders are local notifications you control.

LANTERN
Day 1 is free. The full 21-day path, journal and reminders are part of a Lantern subscription (monthly or yearly), each with a 7-day free trial. Payment is charged to your Apple ID account at confirmation of purchase after the trial. Subscriptions renew automatically unless cancelled at least 24 hours before the end of the current period. Manage or cancel in your Apple ID settings.

Lantern is a reflective companion, not therapy or medical care. If you are struggling, please talk to a professional; if you are in crisis, contact a crisis line or local emergency services.

About the stories: Lantern's daily stories and practices are retold from the parables, psalms and teachings of the Bible in plain language. You can read more about where they come from in the app at any time.

Terms of Use (EULA): https://tryforma.app/lantern/terms.html
Privacy Policy: https://tryforma.app/lantern/privacy.html"""
KEYWORDS="brain fog,depression,daily ritual,mindfulness,stories,mood,stuck,motivation,journal,calm,anxiety"
PROMO="Seven minutes a day for foggy, low, stuck days: a minute of stillness, a short story, one small practice, and a line to carry. Day 1 is free."
WHATS_NEW="Meet your Wisp. Track your clean streak, surf cravings in 3 minutes, taper at your pace, and watch your body bounce back."
def ok(r,what):
    if 'data' in r: return r['data']
    print('FAIL',what,json.dumps(r)[:600]); return None
v=asc.api('GET',f'/v1/apps/{APP}/appStoreVersions?filter[platform]=IOS&limit=1&fields[appStoreVersions]=versionString,appStoreState')['data'][0]
VID=v['id']; print('version', v['attributes'])
# version localization
locs=asc.api('GET',f'/v1/appStoreVersions/{VID}/appStoreVersionLocalizations')['data']
en=next((l for l in locs if l['attributes']['locale']=='en-US'),None)
attrs={'description':DESC,'keywords':KEYWORDS[:100],'promotionalText':PROMO[:170],'supportUrl':'https://tryforma.app/lantern/privacy.html','marketingUrl':'https://tryforma.app/lantern/'}
if en: r=asc.api('PATCH',f"/v1/appStoreVersionLocalizations/{en['id']}",{'data':{'type':'appStoreVersionLocalizations','id':en['id'],'attributes':attrs}})
else: r=asc.api('POST','/v1/appStoreVersionLocalizations',{'data':{'type':'appStoreVersionLocalizations','attributes':dict(attrs,locale='en-US'),'relationships':{'appStoreVersion':{'data':{'type':'appStoreVersions','id':VID}}}}})
en=ok(r,'version loc'); print('version localization ok', en['id'] if en else '')
# app info: subtitle, privacy url, categories
infos=asc.api('GET',f'/v1/apps/{APP}/appInfos')['data']
for info in infos:
    il=asc.api('GET',f"/v1/appInfos/{info['id']}/appInfoLocalizations")['data']
    l=next((x for x in il if x['attributes']['locale']=='en-US'),None)
    a={'subtitle':'7-Minute Ritual for Foggy Days','privacyPolicyUrl':'https://tryforma.app/lantern/privacy.html'}
    if l: r=asc.api('PATCH',f"/v1/appInfoLocalizations/{l['id']}",{'data':{'type':'appInfoLocalizations','id':l['id'],'attributes':a}})
    else: r=asc.api('POST','/v1/appInfoLocalizations',{'data':{'type':'appInfoLocalizations','attributes':dict(a,locale='en-US'),'relationships':{'appInfo':{'data':{'type':'appInfos','id':info['id']}}}}})
    print('appInfo loc', 'ok' if 'data' in r else json.dumps(r)[:300])
    r=asc.api('PATCH',f"/v1/appInfos/{info['id']}",{'data':{'type':'appInfos','id':info['id'],'relationships':{'primaryCategory':{'data':{'type':'appCategories','id':'HEALTH_AND_FITNESS'}},'secondaryCategory':{'data':{'type':'appCategories','id':'LIFESTYLE'}}}}})
    print('categories', 'ok' if 'data' in r else json.dumps(r)[:300])
# content rights + version attrs
r=asc.api('PATCH',f'/v1/apps/{APP}',{'data':{'type':'apps','id':APP,'attributes':{'contentRightsDeclaration':'DOES_NOT_USE_THIRD_PARTY_CONTENT'}}}); print('content rights', 'ok' if 'data' in r else json.dumps(r)[:200])
r=asc.api('PATCH',f'/v1/appStoreVersions/{VID}',{'data':{'type':'appStoreVersions','id':VID,'attributes':{'copyright':'2026 RZ International LLC','releaseType':'AFTER_APPROVAL'}}}); print('version attrs', 'ok' if 'data' in r else json.dumps(r)[:200])
# review details
rd=asc.api('GET',f'/v1/appStoreVersions/{VID}/appStoreReviewDetail')
ra={'contactFirstName':'Ruihao','contactLastName':'Zhao','contactPhone':'+14155550100','contactEmail':'ray@thezenithlabs.com','demoAccountRequired':False,'notes':'Lantern is a fully local daily reflection app. No account or sign-in. Onboarding asks how the user has been feeling, then shows the paywall (monthly or yearly with a 7-day free trial). Tap "Just show me Day 1" to use Day 1 free; Days 2-21 require the subscription. Each day: 60-second stillness, a short story, a practice, a journal prompt, an anchor line. Stories are retold from Bible parables and psalms in plain language; the source is disclosed in-app (Settings > About the stories, and a Day 7 card) and in this description. Not medical advice; crisis resources are linked.'}
if rd.get('data'): r=asc.api('PATCH',f"/v1/appStoreReviewDetails/{rd['data']['id']}",{'data':{'type':'appStoreReviewDetails','id':rd['data']['id'],'attributes':ra}})
else: r=asc.api('POST','/v1/appStoreReviewDetails',{'data':{'type':'appStoreReviewDetails','attributes':ra,'relationships':{'appStoreVersion':{'data':{'type':'appStoreVersions','id':VID}}}}})
print('review detail', 'ok' if 'data' in r else json.dumps(r)[:300])
# screenshots 6.7"
if en and SHOTS:
    sets=asc.api('GET',f"/v1/appStoreVersionLocalizations/{en['id']}/appScreenshotSets?fields[appScreenshotSets]=screenshotDisplayType")['data']
    st=next((s for s in sets if s['attributes']['screenshotDisplayType']=='APP_IPHONE_67'),None)
    if not st: st=ok(asc.api('POST','/v1/appScreenshotSets',{'data':{'type':'appScreenshotSets','attributes':{'screenshotDisplayType':'APP_IPHONE_67'},'relationships':{'appStoreVersionLocalization':{'data':{'type':'appStoreVersionLocalizations','id':en['id']}}}}}),'set')
    have=[x['attributes']['fileName'] for x in asc.api('GET',f"/v1/appScreenshotSets/{st['id']}/appScreenshots?fields[appScreenshots]=fileName")['data']]
    for f in SHOTS:
        if os.path.basename(f) in have: continue
        r=asc.upload_asset('/v1/appScreenshots',{'data':{'type':'appScreenshots','attributes':{'fileName':os.path.basename(f)},'relationships':{'appScreenshotSet':{'data':{'type':'appScreenshotSets','id':st['id']}}}}},f,'appScreenshots')
        print('  shot', os.path.basename(f), 'ok' if 'data' in r else json.dumps(r)[:200])
# subscription review screenshots (helps clear MISSING_METADATA)
for sid in ('6808838512','6808841356'):
    cur=asc.api('GET',f'/v1/subscriptions/{sid}/appStoreReviewScreenshot')
    if cur.get('data'): print('sub', sid, 'review shot exists'); continue
    if not SHOTS: print('no screenshots yet for sub review'); continue
    r=asc.upload_asset('/v1/subscriptionAppStoreReviewScreenshots',{'data':{'type':'subscriptionAppStoreReviewScreenshots','attributes':{'fileName':'01_home.png'},'relationships':{'subscription':{'data':{'type':'subscriptions','id':sid}}}}},SHOTS[0],'subscriptionAppStoreReviewScreenshots')
    print('sub', sid, 'review shot', 'ok' if 'data' in r else json.dumps(r)[:300])
time.sleep(3)
for sid in ('6808838512','6808841356'):
    print('sub state', asc.api('GET',f'/v1/subscriptions/{sid}?fields[subscriptions]=name,state')['data']['attributes'])
print('DONE')
