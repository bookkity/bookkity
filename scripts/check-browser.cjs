const {chromium}=require('playwright-core');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/etc/profiles/per-user/igor/bin/chromium',headless:true,args:['--no-sandbox']});
 const context=await browser.newContext();
 // Avoid analytics writes and external resources during regression checks.
 await context.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
 const page=await context.newPage();
 const errors=[]; page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error' && /hydration|Minified React|did not match/i.test(m.text()))errors.push(m.text())});
 const manifest=JSON.parse(fs.readFileSync(process.cwd()+'/.next/prerender-manifest.json'));
 const routes=Object.keys(manifest.routes); const results=[];
 for(const route of routes){
  const response=await page.goto('http://127.0.0.1:3417'+route,{waitUntil:'networkidle'});
  if(response.status()!==200) throw Error(route+': '+response.status());
  await page.waitForFunction(()=>window.__NEXT_DATA__ && document.body.innerText.length>0);
  const tabs=page.getByRole('tab');
  if(await tabs.count()>1){await tabs.nth(1).click();if(await tabs.nth(1).getAttribute('aria-selected')!=='true')throw Error('Tab failure '+route);}
  results.push({route,status:response.status(),tabs:await tabs.count()});
 }
 await page.goto('http://127.0.0.1:3417/merch',{waitUntil:'networkidle'});
 await page.getByRole('button',{name:'Rozumiem / I understand'}).click();
 if(await page.getByRole('heading',{name:'Polish Community Only'}).count())throw Error('Popup did not close');
 await page.reload({waitUntil:'networkidle'});
 if(await page.getByRole('heading',{name:'Polish Community Only'}).count())throw Error('Popup preference did not persist');
 await page.goto('http://127.0.0.1:3417/article/kotlin-multiplatform-a-practical-use-case-of-js-target',{waitUntil:'networkidle'});
 const keys=page.locator('[data-skbtn="ㄱ"]');
 if(await keys.count()){
  await keys.first().click(); await page.locator('[data-skbtn="ㅏ"]').first().click();
  if(await page.getByPlaceholder('Use keyboard to type Korean').inputValue()!=='가') throw Error('Hangul composition failed');
  await page.locator('[data-skbtn="{bksp}"]').first().click();
  if(await page.getByPlaceholder('Use keyboard to type Korean').inputValue()!=='ㄱ')throw Error('Hangul backspace failed');
 }else throw Error('Keyboard not found');
 for(const width of [390,1440]){
  await page.setViewportSize({width,height:900});
  await page.goto('http://127.0.0.1:3417/merch',{waitUntil:'networkidle'});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  if(overflow)throw Error('Merch overflow at '+width);
 }
 await browser.close();
 fs.writeFileSync('audit/browser-check.json',JSON.stringify({routes:results,errors,checks:['MDX tab selection','Hangul composition and backspace','Popup dismissal and persistence','Merch layout at 390 and 1440 pixels'],externalRequests:'blocked'},null,2)+'\n');
 console.log(JSON.stringify({routes:results.length,errors}));
 if(errors.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});
