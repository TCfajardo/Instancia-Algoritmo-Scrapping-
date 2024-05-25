"""
OBJETIVO: 
    - Extraer informacion sobre los productos en la pagina de Mercado Libre Mascotas
    - Aprender a realizar extracciones verticales y horizontales utilizando reglas
CREADO POR: LEONARDO KUFFO
ULTIMA VEZ EDITADO: 28 FEBRERO 2023
"""
from scrapy.item import Field
from scrapy.item import Item
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
        'CLOSESPIDER_PAGECOUNT': 20 # Numero maximo de paginas en las cuales voy a descargar items. Scrapy se cierra cuando alcanza este numero
    }

    # Utilizamos 2 dominios permitidos, ya que los articulos utilizan un dominio diferente
    allowed_domains = ['articulo.mercadolibre.com.ec', 'listado.mercadolibre.com.ec']

    start_urls = ['https://listado.mercadolibre.com.ec/animales-mascotas/perros/']

    download_delay = 3

    # Tupla de reglas
    rules = (
        Rule( # REGLA #1 => HORIZONTALIDAD POR PAGINACION
            LinkExtractor(
                allow=r'/_Desde_\d+' # Patron en donde se utiliza "\d+", expresion que puede tomar el valor de cualquier combinacion de numeros
            ), follow=True),
        Rule( # REGLA #2 => VERTICALIDAD AL DETALLE DE LOS PRODUCTOS
            LinkExtractor(
                allow=r'/MEC-' 
            ), follow=True, callback='parse_items'), # Al entrar al detalle de los productos, se llama al callback con la respuesta al requerimiento
    )

    def parse_items(self, response):
        keyword = 'beagle'

        item = ItemLoader(Articulo(), response)
    
        item.add_xpath('titulo', '//h1/text()', MapCompose(lambda i: i.replace('\n', ' ').replace('\r', ' ').strip()))
    
        title = item.get_xpath('//h1/text()')  # Cambio aquí
        if not any(keyword in t.lower() for t in title):  # Cambio aquí
            return

        item.add_xpath('descripcion', '//div[@class="ui-pdp-description"]/p/text()', MapCompose(lambda i: i.replace('\n', ' ').replace('\r', ' ').strip()))

        soup = BeautifulSoup(response.body, 'html.parser')
        precio = soup.find(class_="andes-money-amount__fraction")
        precio_completo = precio.text.replace('\n', ' ').replace('\r', ' ').replace(' ', '')
        item.add_value('precio', precio_completo)

        yield item.load_item()
