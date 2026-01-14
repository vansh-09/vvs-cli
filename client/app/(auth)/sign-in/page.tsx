"use client"; 

import { LoginForm } from "@/components/login-form";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";

const Page = () => {
  const { data, isPending } = authClient.useSession();
  const router = useRouter();

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Spinner />
      </div>
    );
  }
  if (data?.session && data?.user) {
    router.push("/sign-in");
  }
  return (
    <>
      <LoginForm />
    </>
  );
};

export default Page;
