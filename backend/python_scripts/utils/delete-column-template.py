import sqlite3

DB_PATH = '../data/data.db'
TABLE_NAME = 'products'
COLUMN_TO_REMOVE = 'short_name'

def remove_column(db_path, table_name, column_to_remove):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # 获取原表结构
    cursor.execute(f"PRAGMA table_info({table_name})")
    columns = cursor.fetchall()
    column_names = [col[1] for col in columns if col[1] != column_to_remove]
    columns_str = ', '.join(column_names)

    # 创建新表结构（手动写 CREATE TABLE 语句，去掉要删除的列）
    # 这里假设你已经知道新表结构，或者可以自动生成
    # 示例：CREATE TABLE new_table (col1 TEXT, col2 INTEGER, ...)
    # 你可以根据 columns 变量自动生成
    new_table_columns = []
    for col in columns:
        if col[1] != column_to_remove:
            col_def = f"{col[1]} {col[2]}"
            if col[5]:  # 是否为主键
                col_def += " PRIMARY KEY"
            new_table_columns.append(col_def)
    new_table_sql = f"CREATE TABLE {table_name}_new ({', '.join(new_table_columns)})"
    cursor.execute(new_table_sql)

    # 复制数据
    cursor.execute(f"INSERT INTO {table_name}_new ({columns_str}) SELECT {columns_str} FROM {table_name}")

    # 删除原表
    cursor.execute(f"DROP TABLE {table_name}")

    # 重命名新表
    cursor.execute(f"ALTER TABLE {table_name}_new RENAME TO {table_name}")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    remove_column(DB_PATH, TABLE_NAME, COLUMN_TO_REMOVE)