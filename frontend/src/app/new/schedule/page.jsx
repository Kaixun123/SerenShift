import { Layout } from "@/components/Layout";
import TopHeader from "@/components/TopHeader";

export default function Home() {
  return (
    <Layout>
      <TopHeader
        mainText={"New Schedule"}
        subText={"Plan your schedule timely and wisely!"}
      />
      <div className="p-[30px]">new application</div>
    </Layout>
  );
}
