---
url: "kotlin-multiplatform-a-practical-use-case-of-js-target"
date: "2024-06-15"
author: "dzikoysk"
language: "en"
title: "Kotlin Multiplatform: A practical use-case of Kotlin/JS IR compiler"
image: "/0001/create-your-kmm-library.webp"
tags: []
---

[Kotlin Multiplatform](https://kotlinlang.org/docs/multiplatform.html) _(KMP)_ tries to move Kotlin out of the JVM world and make it a universal language for all platforms.
Well... if something is universal, then it's usually not the best at anything. But let's not be so pessimistic.

A while ago, I was working on a project that required a library that is able to process [Hangul (Korean alphabet)](https://en.wikipedia.org/wiki/Hangul) input on frontend.
Why would you need that? Well, Hangul is a bit more complex than the Latin alphabet, and it's not that easy to process it on the client side.
Symbols are combined into syllables, and each syllable is a separate character. Take a look at the following example:

| Input | Input code | Output | Output code |
|-------|------------|--------|-------------|
| ㅇ     | 0x3147     | ㅇ      | 0x3147      |
| ㅏ     | 0x314F     | 아      | 0xC544      |
| ㄴ     | 0x3134     | 안      | 0xC548      |

Interesting, isn't it? There are different types of result characters depending on the context (!), for instance:

```bash
낭 + ㅓ → 나어
```

So now we've got new 2 symbols as a result. You can find more such cases, but in the end it's not a post about Hangul, but about Kotlin Multiplatform.
As a requirements for the library, I had the following points:

1. I need this library on frontend and backend, so I'd like to have a single codebase
2. The output characters can be calculated using some specific formulas, so I should be able to do some basic operations on code points
3. I want to have a possibility to easily test the library

Backend was already in Kotlin, so KMP seemed to be a decent choice.

## Setting up the project

KMP is quite loudly advertised by JetBrains, so I'd expect that setting up the project should be a piece of cake. 
Well, as usual it is unnecessarily complicated, but could be worse. The Gradle structure looks quite standard:

```text
khangul
├── src
│   ├── commonMain
│   │   └── kotlin
│   │       └── <main sources>
│   ├── commonTest
│   │   └── kotlin
│   │       └── <tests for both jvm and js>
│   ├── jsMain
│   │   └── resources
│   │       └── index.html
├── build.gradle.kts
├── gradle.properties
├── settings.gradle.kts
```

The setup for the 2 targets I was interested in (JVM and JS) looked like this in Kotlin 1.8:

```kotlin
kotlin {
    js(IR) {
        binaries.library()
        browser()
        generateTypeScriptDefinitions()
    }

    jvm {
        jvmToolchain(11)
        withJava()
    }
    sourceSets {
        val commonMain by getting
        val commonTest by getting {
            dependencies {
                implementation(kotlin("test"))
            }
        }
        val jvmMain by getting
        val jvmTest by getting
        val jsMain by getting
        val jsTest by getting
    }
}
```

<References links={[
 { title: "What is Kotlin/JS IR compiler", url: "https://kotlinlang.org/docs/js-ir-compiler.html" },
 { title: "Generate TypeScript definitions (Experimental)", url: "https://kotlinlang.org/docs/js-ir-compiler.html#preview-generation-of-typescript-declaration-files-d-ts" },
]} />

## KMP related issues

#### Kotlin/JS runs on Node with... Yarn

I initially thought they took the simplest way, and the project will just simply run on standard Node.js + NPM setup, so I was quite surprised when I started getting errors from Yarn.
Well, it turns out that Gradle cache does not like Yarn lock files, so it's time for our first workaround to actually make it work:

```kotlin
rootProject.plugins.withType(YarnPlugin::class.java) {
    rootProject.the<YarnRootExtension>().yarnLockMismatchReport = YarnLockMismatchReport.WARNING // NONE | FAIL
    rootProject.the<YarnRootExtension>().reportNewYarnLock = false // true
    rootProject.the<YarnRootExtension>().yarnLockAutoReplace = true // true
}
```

<References links={[ 
 { title: "Yarn", url: "https://yarnpkg.com/" },
 { title: "New settings for reporting that yarn.lock has been updated", url: "https://kotlinlang.org/docs/whatsnew18.html#new-settings-for-reporting-that-yarn-lock-has-been-updated" },
]} />

#### Publishing to NPM is not officially supported

As long as you can mark the output as a library with `binaries.library()`, you don't really have a way to publish it to NPM.
In order to do that, you need to use the [mpetuska/npm-publish](https://github.com/mpetuska/npm-publish) plugin:

```kotlin
npmPublish {
    readme.set(file("README.md"))
    packages {
        named("js") {
            packageJson {
                author {
                    name.set("dzikoysk")
                }
                // ...
            }
        }
    }
    registries {
        register("npmjs") {
            uri.set("https://registry.npmjs.org")
            authToken.set(property("npm.token").toString())
        }
    }
}
```

The plugin adds some additional tasks, but to get it all in just one command, you still need to register a new one:

```kotlin
tasks.register("publishNpm") {
    dependsOn("clean", "test", "assembleJsPackage", "packJsPackage", "publishJsPackageToNpmjsRegistry")
    tasks.findByName("test")?.mustRunAfter("clean")
    tasks.findByName("kotlinStoreYarnLock")?.dependsOn("kotlinUpgradeYarnLock")
    tasks.findByName("assembleJsPackage")?.mustRunAfter("test")
    tasks.findByName("packJsPackage")?.mustRunAfter("assembleJsPackage")
    tasks.findByName("publishJsPackageToNpmjsRegistry")?.mustRunAfter("packJsPackage")
}
```

_* meh *_

#### SDK is not the same as on JVM, *obviously*

Java has a decent support for code points that would be good enough for me. Unfortunately, it turns out that part of the `String` class is not ported to [Kotlin mappings](https://youtrack.jetbrains.com/issue/KT-23251)...
This time I was saved by another member of the community, who created a library that provides this missing functionality: [cketti/kotlin-codepoints](https://github.com/cketti/kotlin-codepoints).

### The library

If you're lucky enough to finish the project, you can publish it to NPM and use it in your frontend project.
I actually didn't have any problems with that part, so I can't really complain about it.
The bundle size is of course a bit bigger than the one you'd get with a pure JS library, but it's not that bad.

And this is the result! Try to type `ㅇ` → `ㅏ` → `ㄴ` and see if it really works:

<KhangulKeyboard />

<References links={[
 { title: "Khangul library", url: "https://www.npmjs.com/package/khangul" },
 { title: "Khangul sources on GitHub", url: "https://github.com/dzikoysk/khangul" },
]} />