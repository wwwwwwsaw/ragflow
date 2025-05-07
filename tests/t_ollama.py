# import

from ollama import Client

# from rag.llm.chat_model import OllamaChat


# mdl = OllamaChat(
#             key=llm['api_key'],
#             model_name=mdl_nm,
#             base_url=llm["api_base"]
#         )
# 172.31.224.1
# url =
client = Client(host="http://172.31.224.1:11434")
print(client.list())
