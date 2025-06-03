import {ServiceNetwork} from "@core/service";
import {FactoryDatabase} from "@core/factory";

const serviceNetwork = new ServiceNetwork();

const db = (new FactoryDatabase()).create();

export default function Home() {
    return (
        <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
            <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
                <h1 className='text-4xl'>MatTV</h1>
                <ul className="list-inside list-disc text-sm/6 text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
                    <li className="mb-2 tracking-[-.01em]">
                        Local network IP: {serviceNetwork.getLocalIP()}
                    </li>
                    <li className="mb-2 tracking-[-.01em]">
                        Database: {(db.prepare('SELECT 1').get() as {
                        [key: number]: number
                    })[1] === 1
                        ? <span className='text-green-500'>Connected</span>
                        : <span className='text-red-500'>Disconnected</span>
                    }
                    </li>
                </ul>

                <div className="flex items-center flex-col sm:flex-row">
                    <a
                        className="rounded border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto"
                        href="/login"
                    >
                        Go To Login Page
                    </a>
                </div>
            </main>
        </div>
    );
}
