import Head from 'next/head';
import React, { useEffect, useState, useRef } from 'react';
import CountUp from 'react-countup';
import {
  orkesConductorClient,
  WorkflowExecutor,
  TaskType,
} from "@io-orkes/conductor-javascript";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import getConfig from "next/config";

const { publicRuntimeConfig } = getConfig();
function fetchAPI(str, obj?: RequestInit) {
  return fetch(str, obj)
    .then(async (res) => {
      console.log(res);
      if (res.ok) return res.json();
      try {
        const { message, errorCode } = await res.json();
        throw new Error(errorCode + ': ' + message);
      } catch (err) {
        throw new Error(res.status + ': ' + res.statusText);
      }
    })
    .catch((err) => {
      console.error(err);
      toast.error(err, {
        position: 'top-right',
        autoClose: 5000,
        closeOnClick: true,
        draggable: true,
      });
      // throw err
    });
}

export default function Bones() {
  return (
    <div className="pt-8 pb-80 sm:pt-12 sm:pb-40 lg:pt-24 lg:pb-48">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 sm:static">
        <Head>
          <title>Conductor + Next.js Example</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <header className="relative overflow-hidden">
          <div className="sm:max-w-lg">
            <h1 className="text-4xl font font-extrabold tracking-tight text-gray-900 sm:text-6xl">
            Conductor Purchase, Reserve Credit Demo
            </h1>
            <p className="mt-4 text-xl text-gray-500">
              Buy Something. We check if you have enough credits to buy the item and approve your purchase.
            </p>
          </div>
        </header>
        <ToastContainer />
        <ProductList />
      </div>
    </div>
  );
}

const products = [
  {
    id: 1,
    name: 'Fusion',
    category: 'Icon set',
    href: '#',
    price: 100,
    imageSrc: 'https://tailwindui.com/img/ecommerce-images/product-page-05-related-product-01.jpg',
    imageAlt:
      'Payment application dashboard screenshot with transaction table, financial highlights, and main clients on colorful purple background.',
  },
  {
    id: 2,
    name: 'Icons',
    category: 'Icon set',
    href: '#',
    price: 100,
    imageSrc: 'https://tailwindui.com/img/ecommerce-images/product-page-05-related-product-02.jpg',
    imageAlt:
      'Payment application dashboard screenshot with transaction table, financial highlights, and main clients on colorful purple background.',
  },
  {
    id: 3,
    name: 'Scaffold',
    category: 'Icon set',
    href: '#',
    price: 100,
    imageSrc: 'https://tailwindui.com/img/ecommerce-images/product-page-05-related-product-03.jpg',
    imageAlt:
      'Payment application dashboard screenshot with transaction table, financial highlights, and main clients on colorful purple background.',
  },
  {
    id: 4,
    name: 'Bone',
    category: 'Icon set',
    href: '#',
    price: 100,
    imageSrc: 'https://tailwindui.com/img/ecommerce-images/product-page-05-related-product-04.jpg',
    imageAlt:
      'Payment application dashboard screenshot with transaction table, financial highlights, and main clients on colorful purple background.',
  },
];

function ProductList() {
  const [credit, setCredit] = React.useState<number>(0);
  const [oldCredit, setOldCredit] = React.useState<number>(0);
  const [amount, setAddAmount] = React.useState<number>(0);
  const [inputVisible,toggleInput]=React.useState<boolean>(false);
  
  function handleStateChange(flag:number) {
    if (flag != 0) {
      setOldCredit(credit);
      setCredit(credit - flag);
    } else {
      setOldCredit(credit);
      checkCredit();
    }
    
  }

  function checkCredit(){
    fetchAPI('/api/getCredit').then(res=>setCredit(res.message));
  }
  function addBalance(amount:number){
    fetchAPI(`/api/addBalance?amount=${amount}`).then(res => {
      setOldCredit(credit);
      setCredit(res.message)
    });
  }

  function minusBalance(amount:number){
    fetchAPI(`/api/addBalance?amount=${amount}`).then(res => {
      // setOldCredit(credit);
      // setCredit(res.message)
    });
  }

  function handleAddBalance() {
    if (inputVisible) { 
      addBalance(amount?amount:0)
      toggleInput(!inputVisible)
      setAddAmount(0)
    } else {
      toggleInput(!inputVisible)
    }
  }
  return (
    <div className="bg-white">
      <div className='counter-wrap'>
        <div className='counter-title'>
          Available Credit
        </div>
        <div>
        <CountUp start={oldCredit} end={credit} prefix={'$'} duration={1} />
        </div>
        <div className='button-wrap'>
          <input className={inputVisible?'balance-input':'balance-input inactive'} type="number" value={amount} onChange={(e)=>setAddAmount(parseInt(e.target.value))} />
          <button onClick={()=>handleAddBalance()}>+</button>
        </div>
      </div>
      <div className="max-w-2xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:max-w-7xl lg:px-8">
        <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 sm:gap-y-10 md:grid-cols-4">
          {products.map((product) => (
            <Product product={product} onChange={(flag)=>handleStateChange(flag)} key={product.id} credit={credit} setCredit={setCredit} setOldCredit={setOldCredit} minusBalance={minusBalance} addBalance={addBalance}/>
            ))}
        </div>
      </div>
    </div>
  );
}

type ITEMSTATE = 'NEW' | 'SENDING' | 'ORDERED'| 'ORDER_PENDING' | 'CONFIRMED' | 'CANCELLING' | 'ERROR';

function Product({ product, onChange, credit, setCredit, setOldCredit, minusBalance, addBalance}) {
  const itemId = product.id;
  const price = product.price;
  const [state, setState] = React.useState<ITEMSTATE>('NEW');
  const stateRef = React.useRef<ITEMSTATE>();
  stateRef.current = state;
  const [execId, setExecid] = useState(null);
  const timerRef = useRef(null);

  const toastId = React.useRef(null);
  useEffect(() => {
    const queryStatus = async () => {
      const client = await clientPromise;
      const workflowStatus = await client.workflowResource.getExecutionStatus(
        execId,
        true
      );
      if (
        ["COMPLETED", "FAILED", "TERMINATED"].includes(workflowStatus.status)
      ) {
        if (workflowStatus.status === "COMPLETED") {
        minusBalance(-price);        
        toastId.current = toast.success('Order Confirmed', {
          position: 'top-right',
          closeOnClick: true,
          autoClose:2000,
          draggable: true,
        });
        setState('CONFIRMED');
      } 
      
        clearTimeout(timerRef.current);
        setExecid(null);
        if (workflowStatus.status === "FAILED"){
          toastId.current = toast.success('Order Cancelled - Payment failed', {
            position: 'top-right',
            closeOnClick: true,
            draggable: true,
          });
          setTimeout(()=>{
            setState('NEW');
          }, 3000);
          addBalance(0);
        }
      }
    }
    if (execId) {
      timerRef.current = setInterval(() => {
        queryStatus();
      }, 15000);
    }
  }, [execId])
  
  
  const clientPromise = orkesConductorClient(publicRuntimeConfig.conductor);
  const handleClick = () => {
    setState('ORDERED');
    onChange(parseInt(price));

    toastId.current = toast.success('Order Placed! We will let you know once we confirm your order ', {
      position: 'top-right',
      closeOnClick: true,
      autoClose:2000,
      draggable: true,
    });

    const click = async () => {
      const client = await clientPromise;
      // Create an instance of a workflow executor
      const executor = new WorkflowExecutor(client);
      // using the executor helper start the workflow
      const executionId = await executor.startWorkflow({
        name: publicRuntimeConfig.workflows.checkout,
        version: 1,
        input: {
          availableCredit: credit,
          productID: product.id,
          price: product.price,
       },
        correlationId: "obUser",
      });
      setExecid(executionId);
    };
    click();
  };

  const cancel = () => {
    const cancelOrder = async () => {
      const client = await clientPromise;
      //create an instance of the executor and cancel the running workflow
      const executor = new WorkflowExecutor(client);
      executor.terminate(execId, "User cancelled order");
      // clean the executor id. and clear the timer
      setExecid(null);
      clearTimeout(timerRef.current);
      setState('CANCELLING');
      
      toastId.current = toast.success('Order Cancelled', {
        position: 'top-right',
        closeOnClick: true,
        draggable: true,
      });
      setOldCredit(credit);
      setCredit(credit + price);
      setTimeout(()=>{
        setState('NEW');
      }, 3000);
    };

    cancelOrder();
  };

  useEffect(() => {
    if (state === 'NEW') {
      onChange(0);
    }
  },[])

  return (
    <div key={product.id} className="relative group">
      <div className="aspect-w-4 aspect-h-3 rounded-lg overflow-hidden bg-gray-100">
        {/* eslint-disable @next/next/no-img-element */}
        <img src={product.imageSrc} alt={product.imageAlt} className="object-center object-cover" />
        <div className="flex items-end p-4" aria-hidden="true">
          {
            {
              NEW: (
                <button
                  onClick={handleClick}
                  className="w-full bg-white hover:bg-blue-200 bg-opacity-75 backdrop-filter backdrop-blur py-2 px-4 rounded-md text-sm font-medium text-gray-900 text-center"
                >
                  Buy Now
                </button>
              ),
              ORDERED: (
                <button
                  onClick={cancel}
                  className="w-full bg-white hover:bg-blue-200 bg-opacity-75 backdrop-filter backdrop-blur py-2 px-4 rounded-md text-sm font-medium text-gray-900 text-center"
                >
                  {/* {getState()} */}
                  Click to Cancel
                </button>
              ),
              ORDER_PENDING: (
                <button
                  className="w-full bg-white hover:bg-blue-200 bg-opacity-75 backdrop-filter backdrop-blur py-2 px-4 rounded-md text-sm font-medium text-gray-900 text-center"
                >
                  {/* {getState()} */}
                  Order Placed. Pending Confrimation
                </button>
              ),
              CONFIRMED: (
                <div className="w-full  opacity-100 bg-white bg-opacity-75 backdrop-filter backdrop-blur py-2 px-4 rounded-md text-sm font-medium text-gray-900 text-center">
                  Purchased!
                </div>
              ),
              CANCELLING: (
                <div className="w-full bg-white hover:bg-blue-200 bg-opacity-75 backdrop-filter backdrop-blur py-2 px-4 rounded-md text-sm font-medium text-gray-900 text-center">
                  Cancelling...
                </div>
              ),
              ERROR: (
                <button
                  className="w-full bg-white hover:bg-blue-200 bg-opacity-75 backdrop-filter backdrop-blur py-2 px-4 rounded-md text-sm font-medium text-gray-900 text-center"
                >
                  Error! Click to Retry
                </button>
              ),
            }[state]
          }
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between text-base font-medium text-gray-900 space-x-8">
        <h3>{product.name}</h3>
        <p>{product.price}</p>
      </div>
      <p className="mt-1 text-sm text-gray-500">{product.category}</p>
    </div>
  );
}
