FROM docker.elastic.co/elasticsearch/elasticsearch-oss:6.2.4

RUN bin/elasticsearch-plugin install analysis-icu --batch
RUN bin/elasticsearch-plugin install ingest-attachment --batch

ENV ES_JAVA_OPTS "-Xms1g -Xmx1g"

EXPOSE 9200:9200 9300:9300