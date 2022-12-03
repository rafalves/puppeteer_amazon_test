const { Cluster } = require('puppeteer-cluster');
const converter = require('json-2-csv');
const fs = require('fs'); 
const { clearScreenDown } = require('readline');

(async () => {
    const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_PAGE,
    maxConcurrency: 1,
    timeout: 120000,
    monitor: true,
    puppeteerOptions: {
            headless: true,
            defaultViewport: false,
           // userDataDir: './tmp'
    }
    });

    let fileName = ['14', '14 Plus', '14 Pro', '14 Pro Max']

    const urls = [ 
        'https://www.amazon.com.br/s?k=iphone+14&__mk_pt_BR=%C3%85M%C3%85%C5%BD%C3%95%C3%91&crid=L48EVA1IS7AW&sprefix=iphone+14%2Caps%2C176&ref=nb_sb_noss_1',
        'https://www.amazon.com.br/s?k=iphone+14+plus&__mk_pt_BR=%C3%85M%C3%85%C5%BD%C3%95%C3%91&crid=32MH80IEMIXE8&sprefix=iphone+14+plu%2Caps%2C174&ref=nb_sb_noss_1', 
        'https://www.amazon.com.br/s?k=iphone+14+pro&__mk_pt_BR=%C3%85M%C3%85%C5%BD%C3%95%C3%91&crid=WBQGZ37Z5X9I&sprefix=iphone+14+pro%2Caps%2C197&ref=nb_sb_noss_1', 
        'https://www.amazon.com.br/s?k=iphone+14+pro+max&__mk_pt_BR=%C3%85M%C3%85%C5%BD%C3%95%C3%91&crid=2YJB0JH9171VQ&sprefix=iphone+14+pro+max%2Caps%2C260&ref=nb_sb_noss_1', 
        ];


    cluster.on('taskerror', (err, data) => {
    console.log(`Error crawling ${data}: ${err.message}`);
    });

    await cluster.task(async ({ page, data: url }) => {
        await page.goto(url, {
        waitUntil: 'domcontentloaded',
        });

        const productsHandles = await page.$$('div.s-main-slot.s-result-list.s-search-results.sg-row > .s-result-item');
        const items = []
        let isBtnDisabled = false
    
        while(!isBtnDisabled) {
            await page.waitForSelector('.s-pagination-item.s-pagination-next')
        
            for (const productHandle of productsHandles) {
                let productPrice, productLink, productImageSrc, productTitle = 'Null'
                try {
                    productPrice = await page.evaluate(el => el.querySelector('.a-price-whole').textContent, productHandle);
                    if (productPrice) {
                        productTitle = await page.evaluate(el => el.querySelector('h2 > a > span').textContent, productHandle);
                        let productLinkRaw = await page.evaluate(el => el.querySelector('.a-link-normal').getAttribute('href'), productHandle);
                        productLink = 'https://amazon.com.br' + productLinkRaw
                        productImageSrc = await page.evaluate(el => el.querySelector('.s-image').getAttribute('src'), productHandle);
                        items.push({productTitle, productPrice, productImageSrc, productLink})
                    }    
                } catch (err) {}
            }
            isBtnDisabled = await page.$('.s-pagination-item.s-pagination-next.s-pagination-disabled') !== null;
            if (!isBtnDisabled) {
                try {
                    await page.click('.s-pagination-item.s-pagination-next.s-pagination-button.s-pagination-separator', {
                        delay: 1000
                    })
                } catch (err){}
            }
        }
    
        await page.close();

        let index = urls.indexOf(url)

        converter.json2csv(items, (err, csv) => {
            if (err) {
                console.log('error csv')
            }
            fs.writeFileSync(`iPhones_${fileName[index]}.csv`, csv)
        })
    });

    for (let i = 0; i < urls.length; i ++) {
        await cluster.queue(urls[i]); clearScreenDown
    }

    await cluster.idle();
    await cluster.close();
})();