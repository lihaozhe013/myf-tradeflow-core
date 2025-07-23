import sqlite3

db_path = '../../data/data.db'  # 根据你的目录结构调整路径

def drop_product_categories_table():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute('DROP TABLE IF EXISTS product_categories;')
        conn.commit()
        print("产品种类表 product_categories 已删除（如存在）")
    except Exception as e:
        print("删除表时出错：", e)
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    drop_product_categories_table()