import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import React from "react";

export const CodeVariant = ({ name, children }) => {
    return (
        <div>
            {children}
        </div>
    )
}

export const CodeVariants = ({ tabs, symbol, children }) => {
    tabs = tabs === undefined ? true : tabs
    children = Array.isArray(children) ? children : [children]

    if (tabs) {
        return (
            <Tabs defaultValue={children[0].props.name} className={`code-variants bg-gray-50 rounded-lg`}>
                <TabsList>
                    {children.map(({props}) => (
                        <TabsTrigger key={props.name} value={props.name}>{props.name}</TabsTrigger>
                    ))}
                </TabsList>
                {children.map(variant => (
                    <TabsContent key={variant.props.name} value={variant.props.name} paddingY={2} paddingX={6}>
                        {variant}
                    </TabsContent>
                ))}
            </Tabs>
        )
    }

    symbol = symbol === undefined ? '→' : symbol

    return (
        <div className={`code-variants w-full flex flex-col lg:flex-row pt-5 pb-3 relative max-w-full justify-center`}>
            {children.map((variant, idx) => (
                <>
                    {symbol && idx % 2 === 1 && (
                        <div className={'flex justify-center items-center py-3 lg:px-3 lg:py-0'}>
                            <span className={`text-xl rotate-90 lg:rotate-0`}>
                                →
                            </span>
                        </div>
                    )}
                    <div key={idx} className={`code-variant flex flex-col lg:px-1 first:pl-0 last:pr-0 max-w-full flex-1`}>
                        <div className={''}>
                            <div className={'text-center whitespace-pre py-2 px-20 font-semibold bg-gray-50 rounded-md'}>
                                {variant.props.name}
                            </div>
                        </div>
                        <div className={`text-sm`}>
                            {variant}
                        </div>
                    </div>
                </>
            ))}
        </div>
    )
}