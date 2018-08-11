FROM docker.elastic.co/logstash/logstash:6.2.4

WORKDIR /usr/share/logstash
RUN bin/logstash-plugin install logstash-input-jdbc
RUN bin/logstash-plugin install logstash-filter-json_encode
RUN bin/logstash-plugin install logstash-filter-json
RUN bin/logstash-plugin install logstash-filter-mutate

COPY conf/logstash.conf /etc/logstash/conf.d/logstash.conf
COPY conf/template.json /etc/logstash/conf.d/template.json
COPY connector/* /usr/share/logstash/

# https://github.com/elastic/logstash-docker/issues/45
RUN sed -i '/xpack/d' /usr/share/logstash/config/logstash.yml

EXPOSE 5044:5044
CMD ["logstash", "-f", "/etc/logstash/conf.d/logstash.conf", "--config.reload.automatic", "--debug", "--verbose"]