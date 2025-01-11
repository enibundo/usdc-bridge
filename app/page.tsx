"use client";

import { AccountData, Window as KeplrWindow } from "@keplr-wallet/types";
import { number, z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { SigningStargateClient } from "@cosmjs/stargate";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Loader } from "lucide-react";
import { Registry, GeneratedType } from "@cosmjs/proto-signing";
import { MsgDepositForBurn } from "@/generated/tx";

declare global {
  interface Window extends KeplrWindow {}
}

const cctpTypes: ReadonlyArray<[string, GeneratedType]> = [
  ["/circle.cctp.v1.MsgDepositForBurn", MsgDepositForBurn],
];

function createDefaultRegistry(): Registry {
  return new Registry(cctpTypes);
}

const formSchema = z.object({
  amount: z.string().regex(/^[1-9][0-9]*$/, {
    message: "Amount must be positive number.",
  }),
  recipientAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, {
    message: "Recipient address should be a valid ethereum address.",
  }),
});

export default function Home() {
  const [nobleWalletAddress, setNobleWalletAddress] = useState<string>("");
  const [nobleUsdcBalance, setNobleUsdcBalance] = useState<string>("");
  const [account, setAccount] = useState<AccountData>();
  const [signingClient, setSigningClient] = useState<SigningStargateClient>();

  const [keplrWindow, setKeplrWindow] = useState<KeplrWindow>();

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (signingClient !== undefined && account !== undefined) {
      const rawMintRecipient = values.recipientAddress;
      const cleanedMintRecipient = rawMintRecipient.replace(/^0x/, "");
      const zeroesNeeded = 64 - cleanedMintRecipient.length;
      const mintRecipient = "0".repeat(zeroesNeeded) + cleanedMintRecipient;
      const buffer = Buffer.from(mintRecipient, "hex");
      const mintRecipientBytes = new Uint8Array(buffer);

      console.log("mintRecipient: ", mintRecipient);
      console.log("mintRecipientBytes: ", mintRecipientBytes);

      const msg = {
        typeUrl: "/circle.cctp.v1.MsgDepositForBurn",
        value: {
          from: account.address,
          amount: "1",
          destinationDomain: 0,
          mintRecipient: mintRecipientBytes,
          burnToken: "uusdc",
        },
      };

      const fee = {
        amount: [
          {
            denom: "uusdc",
            amount: "0",
          },
        ],
        gas: "200000",
      };

      const memo = "";

      try {
        const result = await signingClient.signAndBroadcast(
          account.address,
          [msg],
          fee,
          memo
        );
      } catch (e) {
        console.log(e);
      }
    }
  };

  useEffect(() => {
    const { keplr } = window;
    if (!!keplr) {
      setKeplrWindow(keplr);
    }
  }, []);

  useEffect(() => {
    const updateCurrentWalletState = async () => {
      if (keplrWindow !== undefined) {
        const chainId = "grand-1";
        const grandRpcUrl = "https://rpc.testcosmos.directory/nobletestnet";

        await keplrWindow.keplr?.enable(chainId);

        const offlineSigner = keplrWindow.getOfflineSigner?.(chainId);

        const signingClient = await SigningStargateClient.connectWithSigner(
          grandRpcUrl,
          offlineSigner!,
          {
            registry: createDefaultRegistry() as any,
          }
        );

        const accounts = await offlineSigner?.getAccounts();
        const account = accounts![0] as AccountData;

        const uusdcBalance = await signingClient.getBalance(
          account.address,
          "uusdc"
        );

        setSigningClient(signingClient);
        setAccount(account);
        setNobleWalletAddress(account.address);
        setNobleUsdcBalance(
          (Number(uusdcBalance.amount) / 1_000_000).toString()
        );
      }
    };
    updateCurrentWalletState();
  }, [keplrWindow]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "0",
      recipientAddress: "0x0000000000000000000000000000000000000000",
    },
  });

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start border border-teal-50 p-10">
        <Alert>
          {" "}
          {account == undefined ? (
            <center>
              <Loader />
            </center>
          ) : (
            <>
              <Terminal className="h-4 w-4" />
              <AlertTitle>Source Wallet</AlertTitle>
              <AlertDescription>
                - {nobleWalletAddress}
                <br />- {nobleUsdcBalance} USDC
              </AlertDescription>
            </>
          )}{" "}
        </Alert>

        <Separator />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>USDC Amount</FormLabel>
                  <FormControl>
                    <Input placeholder="0" {...field} />
                  </FormControl>
                  <FormDescription>
                    Amount of USDC you want to bridge to the Recipient Address
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="recipientAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="0x0000000000000000000000000000000000000000"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Recipient address in Ethereum Sepolia (Testnet)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Bridge</Button>
          </form>
        </Form>
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        Simple (POC) Noble to Sepolia USDC Bridge
      </footer>
    </div>
  );
}
