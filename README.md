## Node Elasticsearch Example

## Database Structure and Initialization

Please check `data/sample_data.sql` for our sample data.


## Elastic Integration

First of all create your `products` index and `product` type.

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
      "type": "date"
    },
    "updated_at": {
      "type": "date"
    },
    "categories": {
      "type": "object",
      "properties": {
        "id": {
          "type": "long"
        },
        "name": {
          "type": "text"
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