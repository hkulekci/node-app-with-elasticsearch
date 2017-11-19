# Node Elasticsearch Example

## Starting Services

```
docker-compose up elasticsearch kibana
docker-compose up mysql redis
docker-compose up app listener
```

## Database Structure and Initialization

Connect the mysql container with following configuration:

```
Host: mysql
User : root
Password : 123456
Port : 33060
```

And import `data/sample_data.sql` file for our sample data.

Redis configuration :

```
Host: redis
```


## Elastic Integration

Then use Kibana Console interface to be able to create your index. First of all 
create your `products` index and `product` type.

```
DELETE products

PUT products
{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 0
  }
}


PUT products/product/_mapping
{
  "properties": {
    "name": {
      "type": "text"
    },
    "description": {
      "type": "text"
    },
    "quantity": {
      "type": "long"
    },
    "price": {
      "type": "double"
    },
    "created_at": {
      "type": "date",
      "format": "strict_date_optional_time||yyyy-MM-dd HH:mm:ss||yyyy-MM-dd||epoch_millis"
    },
    "updated_at": {
      "type": "date",
      "format": "strict_date_optional_time||yyyy-MM-dd HH:mm:ss||yyyy-MM-dd||epoch_millis"
    },
    "categories": {
      "type": "object",
      "properties": {
        "id": {
          "type": "long"
        },
        "name": {
          "type": "keyword"
        }
      }
    }
  }
}
```

Then check `data/logstash.conf` file and also last part of the 
`data/sample_data.sql`. There is a procedure in there. 

```
DROP PROCEDURE fetchDataForElastic;

DELIMITER //
CREATE PROCEDURE fetchDataForElastic
(IN currentdate Datetime)
BEGIN
  SELECT
    p.*,
    
    CAST( (CONCAT ('[', GROUP_CONCAT(CONCAT('{"id":', c.id, ', "name":"',c.name,'"}')), ']'))  AS JSON) categories
    FROM products p LEFT JOIN product_category pc ON pc.product_id = p.id LEFT JOIN categories c ON c.id = pc.category_id
  WHERE p.updated_at > currentdate GROUP BY p.id;
END //
DELIMITER ;
```

At the end, run logstash. `docker-compose up logstash`

Known Issues : 

 - Sometimes application stack without error while updating product