import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./App.css";

function App() {
  const CONTRACT_ADDRESS = "0x530ed5aa0c66cf4dfbf3209c085617c0fc26513e"; 
  const ABI = [
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_id",
          "type": "uint256"
        }
      ],
      "name": "deleteItem",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "seller",
          "type": "address"
        }
      ],
      "name": "ItemDeleted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "price",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "seller",
          "type": "address"
        }
      ],
      "name": "ItemListed",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "buyer",
          "type": "address"
        }
      ],
      "name": "ItemPurchased",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_name",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "_price",
          "type": "uint256"
        }
      ],
      "name": "listItem",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_id",
          "type": "uint256"
        }
      ],
      "name": "purchaseItem",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_id",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "_to",
          "type": "address"
        }
      ],
      "name": "transferItem",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "stateMutability": "payable",
      "type": "fallback"
    },
    {
      "stateMutability": "payable",
      "type": "receive"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_owner",
          "type": "address"
        }
      ],
      "name": "getItemsByOwner",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "itemCount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "items",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "price",
          "type": "uint256"
        },
        {
          "internalType": "address payable",
          "name": "seller",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "internalType": "bool",
          "name": "isSold",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "ownedItems",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ];

  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState("");
  const [items, setItems] = useState([]);
  const [ownedItems, setOwnedItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: "", price: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(provider);

        const accounts = await provider.send("eth_requestAccounts", []);
        setAccount(accounts[0]);

        const signer = provider.getSigner();
        setSigner(signer);

        const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
        setContract(contractInstance);

        loadItems(contractInstance);
        loadOwnedItems(contractInstance, accounts[0]);

        window.ethereum.on("accountsChanged", async (newAccounts) => {
          setAccount(newAccounts[0]);
          const newSigner = provider.getSigner();
          const newContract = new ethers.Contract(CONTRACT_ADDRESS, ABI, newSigner);
          setSigner(newSigner);
          setContract(newContract);
          loadItems(newContract);
          loadOwnedItems(newContract, newAccounts[0]);
        });
      }
    };

    init();
  }, []);

  const loadItems = async (contractInstance) => {
    if (!contractInstance) return;

    const itemCount = await contractInstance.itemCount();
    let fetchedItems = [];
    for (let i = 1; i <= itemCount; i++) {
      const item = await contractInstance.items(i);
      fetchedItems.push(item);
    }
    setItems(fetchedItems);
  };

  const loadOwnedItems = async (contractInstance, owner) => {
    if (!contractInstance || !owner) return;

    const ownedIds = await contractInstance.getItemsByOwner(owner);
    let fetchedOwnedItems = [];
    for (let id of ownedIds) {
      const item = await contractInstance.items(id);
      fetchedOwnedItems.push(item);
    }
    setOwnedItems(fetchedOwnedItems);
  };

  const listItem = async () => {
    if (!contract || !newItem.name || !newItem.price) return;

    setLoading(true);
    try {
      const tx = await contract.listItem(
        newItem.name,
        ethers.utils.parseEther(newItem.price)
      );
      await tx.wait();
      loadItems(contract);
      setNewItem({ name: "", price: "" });
    } catch (error) {
      console.error("Error listing item:", error);
    }
    setLoading(false);
  };

  const purchaseItem = async (id, price) => {
    if (!contract || !id || !price) return;

    setLoading(true);
    try {
      const tx = await contract.purchaseItem(id, {
        value: ethers.utils.parseEther(price),
      });
      await tx.wait();
      loadItems(contract);
      loadOwnedItems(contract, account);
    } catch (error) {
      console.error("Error purchasing item:", error);
    }
    setLoading(false);
  };

  const deleteItem = async (id) => {
    if (!contract || !id) return;

    setLoading(true);
    try {
      const tx = await contract.deleteItem(id);
      await tx.wait();
      loadItems(contract);
      loadOwnedItems(contract, account);
    } catch (error) {
      console.error("Error deleting item:", error);
    }
    setLoading(false);
  };

  return (
    <div className="App">
      <h1 className="app-title">Marketplace</h1>

      {loading && <p className="loading">Loading...</p>}

      <div className="list-item-section">
        <h2>List an Item</h2>
        <input
          type="text"
          placeholder="Item Name"
          value={newItem.name}
          onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
          className="input-field"
        />
        <input
          type="number"
          placeholder="Item Price (ETH)"
          value={newItem.price}
          onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
          className="input-field"
        />
        <button onClick={listItem} className="btn-list">List Item</button>
      </div>

      <div className="items-section">
        <h2>Items for Sale</h2>
        {items.map((item) => (
          <div key={item.id} className="item-card">
            <p><strong>Name:</strong> {item.name}</p>
            <p><strong>Price:</strong> {ethers.utils.formatEther(item.price)} ETH</p>
            <p><strong>Seller:</strong> {item.seller}</p>
            {!item.isSold && account === item.seller.toLowerCase() && (
              <button onClick={() => deleteItem(item.id)} className="btn-delete">Delete</button>
            )}
            {!item.isSold && account !== item.seller.toLowerCase() && (
              <button onClick={() => purchaseItem(item.id, ethers.utils.formatEther(item.price))} className="btn-buy">
                Buy
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="owned-items-section">
        <h2>Your Items</h2>
        {ownedItems.map((item) => (
          <div key={item.id} className="item-card">
            <p><strong>Name:</strong> {item.name}</p>
            <p><strong>Price:</strong> {ethers.utils.formatEther(item.price)} ETH</p>
            {!item.isSold && (
              <button onClick={() => deleteItem(item.id)} className="btn-delete">Delete</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
