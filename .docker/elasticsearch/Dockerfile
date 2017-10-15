FROM docker.elastic.co/elasticsearch/elasticsearch:5.6.2

RUN bin/elasticsearch-plugin install analysis-icu --batch
RUN bin/elasticsearch-plugin install ingest-attachment --batch
RUN bin/elasticsearch-plugin remove x-pack --purge

ENV ES_JAVA_OPTS "-Xms1g -Xmx1g"

EXPOSE 9200:9200 9300:9300