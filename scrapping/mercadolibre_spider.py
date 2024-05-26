# mercadolibre_spider.py

from scrapy.item import Field, Item
from scrapy.spiders import CrawlSpider, Rule
from scrapy.linkextractors import LinkExtractor
from scrapy.loader import ItemLoader
from bs4 import BeautifulSoup
from itemloaders.processors import MapCompose

class Articulo(Item):
    titulo = Field()
    precio = Field()
    descripcion = Field()

class MercadoLibreCrawler(CrawlSpider):
    name = 'mercadoLibre'

    custom_settings = {
        'USER_AGENT': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
        'CLOSESPIDER_PAGECOUNT': 20
    }

    allowed_domains = ['articulo.mercadolibre.com.ec', 'listado.mercadolibre.com.ec']
    start_urls = ['https://listado.mercadolibre.com.ec/animales-mascotas/perros/']
    download_delay = 3

    rules = (
        Rule(LinkExtractor(allow=r'/_Desde_\d+'), follow=True),
        Rule(LinkExtractor(allow=r'/MEC-'), follow=True, callback='parse_items'),
    )

    def __init__(self, keyword='', *args, **kwargs):
        super(MercadoLibreCrawler, self).__init__(*args, **kwargs)
        self.keyword = keyword.lower()

    def parse_items(self, response):
        item = ItemLoader(Articulo(), response)
        item.add_xpath('titulo', '//h1/text()', MapCompose(lambda i: i.replace('\n', ' ').replace('\r', ' ').strip()))
    
        title = item.get_xpath('//h1/text()')
        if not any(self.keyword in t.lower() for t in title):
            return

        item.add_xpath('descripcion', '//div[@class="ui-pdp-description"]/p/text()', MapCompose(lambda i: i.replace('\n', ' ').replace('\r', ' ').strip()))

        soup = BeautifulSoup(response.body, 'html.parser')
        precio = soup.find(class_="andes-money-amount__fraction")
        precio_completo = precio.text.replace('\n', ' ').replace('\r', ' ').replace(' ', '')
        item.add_value('precio', precio_completo)

        yield item.load_item()
