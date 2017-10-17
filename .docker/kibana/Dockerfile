FROM docker.elastic.co/kibana/kibana:5.6.2

ENV ELASTICSEARCH_URL "http://elasticsearch:9200"

RUN bin/kibana-plugin remove x-pack

EXPOSE 5601:5601